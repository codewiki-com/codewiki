---
title: PyTorch Lightning
description: 使用PyTorch Lightning简化深度学习训练
track: ai
section: deep-learning
difficulty: intermediate
tags:
  - PyTorch Lightning
  - 深度学习
  - 训练
  - 框架
status: imported
origin: old/src/content/docs/ai/pytorch-lightning.zh.md
divergence: 0.329
issues:
  - title-lang-zh
  - title-language
legacy:
  category: AI
  subcategory: Deep Learning
  order: 24
  lastUpdated: 2026-01-07
---

PyTorch Lightning 是一个轻量级的深度学习框架，它在 PyTorch 之上提供了一层高级抽象，帮助研究人员和工程师更高效地组织和扩展深度学习代码。本文将全面介绍 PyTorch Lightning 的核心概念和最佳实践。

---

## Lightning vs 原生 PyTorch

### 为什么选择 PyTorch Lightning？

PyTorch Lightning 的核心理念是将**研究代码**与**工程代码**分离，让开发者专注于模型设计而非训练循环的细节。

**原生 PyTorch 的痛点：**

```python
import torch
import torch.nn as nn
from torch.utils.data import DataLoader

# 原生 PyTorch 训练循环
model = MyModel()
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
criterion = nn.CrossEntropyLoss()

# 手动处理设备
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = model.to(device)

# 冗长的训练循环
for epoch in range(num_epochs):
    model.train()
    for batch_idx, (data, target) in enumerate(train_loader):
        # 手动移动数据到设备
        data, target = data.to(device), target.to(device)

        # 手动梯度清零
        optimizer.zero_grad()

        # 前向传播
        output = model(data)
        loss = criterion(output, target)

        # 反向传播
        loss.backward()
        optimizer.step()

        # 手动记录日志
        if batch_idx % 100 == 0:
            print(f'Epoch: {epoch}, Batch: {batch_idx}, Loss: {loss.item()}')

    # 验证循环
    model.eval()
    val_loss = 0
    with torch.no_grad():
        for data, target in val_loader:
            data, target = data.to(device), target.to(device)
            output = model(data)
            val_loss += criterion(output, target).item()

    print(f'Validation Loss: {val_loss / len(val_loader)}')
```

**使用 PyTorch Lightning：**

```python
import lightning as L
import torch
import torch.nn as nn
import torch.nn.functional as F

class LitModel(L.LightningModule):
    def __init__(self):
        super().__init__()
        self.model = MyModel()

    def training_step(self, batch, batch_idx):
        x, y = batch
        y_hat = self.model(x)
        loss = F.cross_entropy(y_hat, y)
        self.log('train_loss', loss, prog_bar=True)
        return loss

    def validation_step(self, batch, batch_idx):
        x, y = batch
        y_hat = self.model(x)
        loss = F.cross_entropy(y_hat, y)
        self.log('val_loss', loss, prog_bar=True)

    def configure_optimizers(self):
        return torch.optim.Adam(self.parameters(), lr=1e-3)

# 简洁的训练代码
model = LitModel()
trainer = L.Trainer(max_epochs=10, accelerator='auto')
trainer.fit(model, train_loader, val_loader)
```

### 主要优势对比

| 特性 | 原生 PyTorch | PyTorch Lightning |
|------|-------------|-------------------|
| 训练循环 | 手动编写 | 自动处理 |
| 设备管理 | 手动 `.to(device)` | 自动处理 |
| 分布式训练 | 复杂配置 | 一行代码 |
| 混合精度 | 手动配置 | 参数开关 |
| 梯度累积 | 手动实现 | 参数设置 |
| 早停机制 | 手动实现 | 内置回调 |
| 模型检查点 | 手动保存 | 自动保存 |
| 日志记录 | 手动集成 | 原生支持 |

---

## LightningModule 详解

`LightningModule` 是 PyTorch Lightning 的核心组件，它继承自 `nn.Module`，通过定义特定的方法来组织训练逻辑。

### 核心方法

```python
import lightning as L
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchmetrics import Accuracy

class ImageClassifier(L.LightningModule):
    """图像分类模型示例"""

    def __init__(self, num_classes=10, learning_rate=1e-3):
        super().__init__()
        # 保存超参数，可通过 self.hparams 访问
        self.save_hyperparameters()

        # 定义模型架构
        self.conv1 = nn.Conv2d(3, 32, 3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, 3, padding=1)
        self.conv3 = nn.Conv2d(64, 128, 3, padding=1)
        self.pool = nn.MaxPool2d(2, 2)
        self.fc1 = nn.Linear(128 * 4 * 4, 512)
        self.fc2 = nn.Linear(512, num_classes)
        self.dropout = nn.Dropout(0.5)

        # 定义评估指标
        self.train_acc = Accuracy(task='multiclass', num_classes=num_classes)
        self.val_acc = Accuracy(task='multiclass', num_classes=num_classes)
        self.test_acc = Accuracy(task='multiclass', num_classes=num_classes)

    def forward(self, x):
        """定义前向传播，用于推理"""
        x = self.pool(F.relu(self.conv1(x)))
        x = self.pool(F.relu(self.conv2(x)))
        x = self.pool(F.relu(self.conv3(x)))
        x = x.view(-1, 128 * 4 * 4)
        x = self.dropout(F.relu(self.fc1(x)))
        x = self.fc2(x)
        return x

    def training_step(self, batch, batch_idx):
        """训练步骤"""
        x, y = batch
        logits = self(x)
        loss = F.cross_entropy(logits, y)
        preds = torch.argmax(logits, dim=1)

        # 更新并记录指标
        self.train_acc(preds, y)
        self.log('train_loss', loss, on_step=True, on_epoch=True, prog_bar=True)
        self.log('train_acc', self.train_acc, on_step=False, on_epoch=True, prog_bar=True)

        return loss

    def validation_step(self, batch, batch_idx):
        """验证步骤"""
        x, y = batch
        logits = self(x)
        loss = F.cross_entropy(logits, y)
        preds = torch.argmax(logits, dim=1)

        self.val_acc(preds, y)
        self.log('val_loss', loss, on_step=False, on_epoch=True, prog_bar=True)
        self.log('val_acc', self.val_acc, on_step=False, on_epoch=True, prog_bar=True)

    def test_step(self, batch, batch_idx):
        """测试步骤"""
        x, y = batch
        logits = self(x)
        loss = F.cross_entropy(logits, y)
        preds = torch.argmax(logits, dim=1)

        self.test_acc(preds, y)
        self.log('test_loss', loss)
        self.log('test_acc', self.test_acc)

    def predict_step(self, batch, batch_idx):
        """预测步骤"""
        x, _ = batch
        logits = self(x)
        return torch.argmax(logits, dim=1)

    def configure_optimizers(self):
        """配置优化器和学习率调度器"""
        optimizer = torch.optim.AdamW(
            self.parameters(),
            lr=self.hparams.learning_rate,
            weight_decay=0.01
        )
        scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
            optimizer,
            T_max=self.trainer.max_epochs
        )
        return {
            'optimizer': optimizer,
            'lr_scheduler': {
                'scheduler': scheduler,
                'interval': 'epoch',
                'frequency': 1
            }
        }
```

### 生命周期钩子

LightningModule 提供了丰富的生命周期钩子，用于在训练的不同阶段执行自定义逻辑：

```python
class ModelWithHooks(L.LightningModule):

    def on_fit_start(self):
        """训练开始前调用"""
        print("开始训练")

    def on_fit_end(self):
        """训练结束后调用"""
        print("训练完成")

    def on_train_epoch_start(self):
        """每个训练 epoch 开始时调用"""
        print(f"Epoch {self.current_epoch} 开始")

    def on_train_epoch_end(self):
        """每个训练 epoch 结束时调用"""
        # 可以在这里执行 epoch 级别的操作
        pass

    def on_validation_epoch_start(self):
        """验证 epoch 开始时调用"""
        pass

    def on_validation_epoch_end(self):
        """验证 epoch 结束时调用"""
        # 收集验证结果
        pass

    def on_train_batch_start(self, batch, batch_idx):
        """每个训练 batch 开始前调用"""
        pass

    def on_train_batch_end(self, outputs, batch, batch_idx):
        """每个训练 batch 结束后调用"""
        pass

    def on_before_backward(self, loss):
        """反向传播前调用"""
        pass

    def on_after_backward(self):
        """反向传播后调用"""
        # 可以在这里检查梯度
        pass

    def on_before_optimizer_step(self, optimizer):
        """优化器更新前调用"""
        # 可以在这里进行梯度裁剪
        pass
```

### 方法推荐顺序

根据 Lightning 官方风格指南，LightningModule 中方法的推荐顺序：

1. `__init__` - 模型/系统定义
2. `forward` - 推理逻辑（如需要）
3. `training_step` - 训练钩子
4. `validation_step` - 验证钩子
5. `test_step` - 测试钩子
6. `predict_step` - 预测钩子
7. `configure_optimizers` - 优化器配置
8. 其他钩子方法

---

## Trainer 训练器

`Trainer` 是 PyTorch Lightning 中负责所有训练工程细节的组件，它封装了训练循环、硬件管理、日志记录等功能。

### 基本用法

```python
import lightning as L
from lightning.pytorch.callbacks import ModelCheckpoint, EarlyStopping

# 基本训练器
trainer = L.Trainer(
    max_epochs=100,
    accelerator='auto',  # 自动选择最佳加速器
    devices='auto',       # 自动选择设备数量
)

# 训练模型
trainer.fit(model, train_dataloaders=train_loader, val_dataloaders=val_loader)

# 测试模型
trainer.test(model, dataloaders=test_loader)

# 预测
predictions = trainer.predict(model, dataloaders=predict_loader)
```

### 常用参数配置

```python
trainer = L.Trainer(
    # 训练轮数控制
    max_epochs=100,              # 最大训练轮数
    min_epochs=10,               # 最小训练轮数
    max_steps=-1,                # 最大训练步数（-1 表示不限制）

    # 硬件加速
    accelerator='gpu',           # 加速器类型：'cpu', 'gpu', 'tpu', 'auto'
    devices=4,                   # 使用的设备数量
    strategy='ddp',              # 分布式策略
    precision='16-mixed',        # 混合精度训练

    # 梯度相关
    accumulate_grad_batches=4,   # 梯度累积步数
    gradient_clip_val=1.0,       # 梯度裁剪值
    gradient_clip_algorithm='norm',  # 裁剪算法：'norm' 或 'value'

    # 验证相关
    val_check_interval=0.25,     # 验证频率（0.25 表示每 25% epoch 验证一次）
    check_val_every_n_epoch=1,   # 每 n 个 epoch 验证一次
    num_sanity_val_steps=2,      # 训练前的验证步数（用于检查）

    # 日志相关
    logger=True,                 # 启用默认日志记录器
    log_every_n_steps=50,        # 日志记录频率
    enable_progress_bar=True,    # 显示进度条

    # 检查点
    enable_checkpointing=True,   # 启用检查点保存
    default_root_dir='./logs',   # 默认保存目录

    # 调试
    fast_dev_run=False,          # 快速开发运行（仅运行少量 batch）
    overfit_batches=0,           # 过拟合测试
    limit_train_batches=1.0,     # 限制训练 batch 数量
    limit_val_batches=1.0,       # 限制验证 batch 数量

    # 确定性
    deterministic=True,          # 确定性训练
    benchmark=False,             # cudnn benchmark
)
```

### 从检查点恢复训练

```python
# 从检查点恢复训练
trainer = L.Trainer(max_epochs=100)

# 方法1：自动恢复最新检查点
trainer.fit(model, train_loader, ckpt_path='last')

# 方法2：指定检查点路径
trainer.fit(model, train_loader, ckpt_path='path/to/checkpoint.ckpt')

# 仅加载模型权重（不恢复训练状态）
model = LitModel.load_from_checkpoint('path/to/checkpoint.ckpt')
```

---

## Callbacks 回调机制

回调（Callbacks）是 PyTorch Lightning 中用于在训练过程中注入自定义行为的机制。Lightning 提供了丰富的内置回调，同时支持自定义回调。

### 内置回调

```python
from lightning.pytorch.callbacks import (
    ModelCheckpoint,
    EarlyStopping,
    LearningRateMonitor,
    RichProgressBar,
    TQDMProgressBar,
    DeviceStatsMonitor,
    BatchSizeFinder,
    LearningRateFinder,
    GradientAccumulationScheduler,
    StochasticWeightAveraging,
)

# 模型检查点回调
checkpoint_callback = ModelCheckpoint(
    dirpath='checkpoints/',
    filename='model-{epoch:02d}-{val_loss:.2f}',
    monitor='val_loss',
    mode='min',
    save_top_k=3,
    save_last=True,
    every_n_epochs=1,
    save_weights_only=False,
)

# 早停回调
early_stopping = EarlyStopping(
    monitor='val_loss',
    min_delta=0.001,
    patience=10,
    mode='min',
    check_finite=True,
)

# 学习率监控
lr_monitor = LearningRateMonitor(logging_interval='step')

# 设备状态监控
device_stats = DeviceStatsMonitor()

# 随机权重平均（SWA）
swa = StochasticWeightAveraging(
    swa_lrs=1e-4,
    swa_epoch_start=0.8,  # 在 80% epochs 后开始 SWA
)

# 梯度累积调度器
grad_accumulator = GradientAccumulationScheduler(
    scheduling={0: 8, 4: 4, 8: 1}  # epoch 0-3: 累积8步, epoch 4-7: 累积4步, epoch 8+: 不累积
)

# 配置 Trainer
trainer = L.Trainer(
    max_epochs=100,
    callbacks=[
        checkpoint_callback,
        early_stopping,
        lr_monitor,
        device_stats,
        swa,
    ]
)
```

### 自定义回调

```python
from lightning.pytorch.callbacks import Callback

class PrintCallback(Callback):
    """简单的打印回调示例"""

    def on_train_start(self, trainer, pl_module):
        print("训练开始！")

    def on_train_end(self, trainer, pl_module):
        print("训练完成！")

class GradientLoggerCallback(Callback):
    """梯度日志回调"""

    def on_after_backward(self, trainer, pl_module):
        # 记录梯度范数
        total_norm = 0.0
        for p in pl_module.parameters():
            if p.grad is not None:
                param_norm = p.grad.data.norm(2)
                total_norm += param_norm.item() ** 2
        total_norm = total_norm ** 0.5
        pl_module.log('grad_norm', total_norm)

class ConfusionMatrixCallback(Callback):
    """混淆矩阵回调"""

    def __init__(self, num_classes):
        super().__init__()
        self.num_classes = num_classes
        self.preds = []
        self.targets = []

    def on_validation_batch_end(self, trainer, pl_module, outputs, batch, batch_idx):
        x, y = batch
        logits = pl_module(x)
        preds = torch.argmax(logits, dim=1)
        self.preds.append(preds.cpu())
        self.targets.append(y.cpu())

    def on_validation_epoch_end(self, trainer, pl_module):
        all_preds = torch.cat(self.preds)
        all_targets = torch.cat(self.targets)

        # 计算混淆矩阵
        from sklearn.metrics import confusion_matrix
        cm = confusion_matrix(all_targets.numpy(), all_preds.numpy())

        # 可以将混淆矩阵记录到日志器
        if trainer.logger:
            # 使用 matplotlib 绘制并记录
            import matplotlib.pyplot as plt
            import seaborn as sns

            fig, ax = plt.subplots(figsize=(10, 8))
            sns.heatmap(cm, annot=True, fmt='d', ax=ax)
            ax.set_xlabel('预测标签')
            ax.set_ylabel('真实标签')

            trainer.logger.experiment.add_figure('confusion_matrix', fig, trainer.current_epoch)
            plt.close(fig)

        # 清空缓存
        self.preds.clear()
        self.targets.clear()

class ModelEMACallback(Callback):
    """指数移动平均（EMA）回调"""

    def __init__(self, decay=0.999):
        super().__init__()
        self.decay = decay
        self.ema_weights = None

    def on_fit_start(self, trainer, pl_module):
        # 初始化 EMA 权重
        self.ema_weights = {
            name: param.clone().detach()
            for name, param in pl_module.named_parameters()
        }

    def on_train_batch_end(self, trainer, pl_module, outputs, batch, batch_idx):
        # 更新 EMA 权重
        with torch.no_grad():
            for name, param in pl_module.named_parameters():
                if param.requires_grad:
                    self.ema_weights[name].mul_(self.decay).add_(
                        param.data, alpha=1 - self.decay
                    )

    def on_validation_epoch_start(self, trainer, pl_module):
        # 验证时使用 EMA 权重
        self.original_weights = {
            name: param.clone()
            for name, param in pl_module.named_parameters()
        }
        for name, param in pl_module.named_parameters():
            param.data.copy_(self.ema_weights[name])

    def on_validation_epoch_end(self, trainer, pl_module):
        # 恢复原始权重
        for name, param in pl_module.named_parameters():
            param.data.copy_(self.original_weights[name])

# 使用自定义回调
trainer = L.Trainer(
    max_epochs=100,
    callbacks=[
        PrintCallback(),
        GradientLoggerCallback(),
        ConfusionMatrixCallback(num_classes=10),
        ModelEMACallback(decay=0.999),
    ]
)
```

---

## 日志记录与可视化

PyTorch Lightning 提供了灵活的日志记录系统，支持多种流行的日志后端。

### 支持的日志器

```python
from lightning.pytorch.loggers import (
    TensorBoardLogger,
    WandbLogger,
    MLFlowLogger,
    CometLogger,
    CSVLogger,
)

# TensorBoard 日志器
tb_logger = TensorBoardLogger(
    save_dir='logs/',
    name='my_experiment',
    version='v1',
    log_graph=True,
)

# Weights & Biases 日志器
wandb_logger = WandbLogger(
    project='my_project',
    name='experiment_1',
    save_dir='logs/',
    log_model=True,
)

# MLflow 日志器
mlflow_logger = MLFlowLogger(
    experiment_name='my_experiment',
    tracking_uri='http://localhost:5000',
)

# CSV 日志器
csv_logger = CSVLogger(
    save_dir='logs/',
    name='csv_logs',
)

# 使用多个日志器
trainer = L.Trainer(
    max_epochs=100,
    logger=[tb_logger, wandb_logger],
)
```

### 在模型中记录日志

```python
class LitModel(L.LightningModule):

    def training_step(self, batch, batch_idx):
        x, y = batch
        logits = self(x)
        loss = F.cross_entropy(logits, y)

        # 基本日志记录
        self.log('train_loss', loss)

        # 带选项的日志记录
        self.log(
            'train_loss_detailed',
            loss,
            on_step=True,      # 每步记录
            on_epoch=True,     # 每 epoch 记录（自动聚合）
            prog_bar=True,     # 在进度条显示
            logger=True,       # 发送到日志器
            sync_dist=True,    # 分布式训练时同步
        )

        # 批量记录多个指标
        self.log_dict({
            'loss': loss,
            'accuracy': accuracy,
            'lr': self.optimizers().param_groups[0]['lr'],
        })

        return loss

    def validation_step(self, batch, batch_idx):
        x, y = batch
        logits = self(x)
        loss = F.cross_entropy(logits, y)

        # 分布式训练中同步日志
        self.log('val_loss', loss, sync_dist=True)

    def on_train_epoch_end(self):
        # 记录图像
        if self.trainer.logger:
            # 记录样本图像
            sample_imgs = self.get_sample_images()
            self.logger.experiment.add_images(
                'generated_images',
                sample_imgs,
                self.current_epoch
            )

            # 记录直方图
            for name, param in self.named_parameters():
                self.logger.experiment.add_histogram(
                    name, param, self.current_epoch
                )
```

### 使用 TorchMetrics

```python
from torchmetrics import (
    Accuracy, Precision, Recall, F1Score,
    AUROC, ConfusionMatrix, MeanSquaredError,
)
from torchmetrics.classification import MulticlassAccuracy

class LitClassifier(L.LightningModule):
    def __init__(self, num_classes):
        super().__init__()
        self.model = MyModel()

        # 定义指标（使用 torchmetrics）
        self.train_metrics = torch.nn.ModuleDict({
            'acc': MulticlassAccuracy(num_classes=num_classes),
            'f1': F1Score(task='multiclass', num_classes=num_classes),
        })

        self.val_metrics = torch.nn.ModuleDict({
            'acc': MulticlassAccuracy(num_classes=num_classes),
            'f1': F1Score(task='multiclass', num_classes=num_classes),
            'auroc': AUROC(task='multiclass', num_classes=num_classes),
        })

    def training_step(self, batch, batch_idx):
        x, y = batch
        logits = self.model(x)
        loss = F.cross_entropy(logits, y)
        preds = torch.argmax(logits, dim=1)

        # 更新指标
        for name, metric in self.train_metrics.items():
            metric(preds, y)
            self.log(f'train_{name}', metric, on_epoch=True)

        self.log('train_loss', loss)
        return loss

    def validation_step(self, batch, batch_idx):
        x, y = batch
        logits = self.model(x)
        loss = F.cross_entropy(logits, y)
        probs = F.softmax(logits, dim=1)
        preds = torch.argmax(logits, dim=1)

        # 更新指标
        self.val_metrics['acc'](preds, y)
        self.val_metrics['f1'](preds, y)
        self.val_metrics['auroc'](probs, y)

        for name, metric in self.val_metrics.items():
            self.log(f'val_{name}', metric, on_epoch=True)

        self.log('val_loss', loss)
```

---

## 分布式训练

PyTorch Lightning 大大简化了分布式训练的配置，只需修改几个参数即可实现多 GPU、多节点训练。

### 单机多 GPU 训练

```python
# 使用所有可用 GPU
trainer = L.Trainer(
    accelerator='gpu',
    devices='auto',
    strategy='ddp',
)

# 指定 GPU 数量
trainer = L.Trainer(
    accelerator='gpu',
    devices=4,
    strategy='ddp',
)

# 指定特定 GPU
trainer = L.Trainer(
    accelerator='gpu',
    devices=[0, 2, 3],  # 使用 GPU 0, 2, 3
    strategy='ddp',
)
```

### 多节点训练

```python
# 多节点配置
trainer = L.Trainer(
    accelerator='gpu',
    devices=8,          # 每个节点的 GPU 数量
    num_nodes=4,        # 节点数量
    strategy='ddp',
)
```

### 分布式策略

```python
# DDP (Distributed Data Parallel) - 最常用
trainer = L.Trainer(
    accelerator='gpu',
    devices=8,
    strategy='ddp',
)

# DDP Spawn - 使用 spawn 启动进程
trainer = L.Trainer(
    accelerator='gpu',
    devices=8,
    strategy='ddp_spawn',
)

# FSDP (Fully Sharded Data Parallel) - 适合超大模型
trainer = L.Trainer(
    accelerator='gpu',
    devices=8,
    strategy='fsdp',
)

# DeepSpeed - 适合超大规模训练
trainer = L.Trainer(
    accelerator='gpu',
    devices=8,
    strategy='deepspeed_stage_2',  # 或 deepspeed_stage_3
)
```

### 混合精度训练

```python
# 16位混合精度（推荐）
trainer = L.Trainer(
    accelerator='gpu',
    devices=8,
    precision='16-mixed',
)

# BFloat16 混合精度（适合较新的 GPU）
trainer = L.Trainer(
    accelerator='gpu',
    devices=8,
    precision='bf16-mixed',
)

# 完全 16 位训练
trainer = L.Trainer(
    accelerator='gpu',
    devices=8,
    precision='16-true',
)
```

### 分布式训练中的注意事项

```python
class DistributedModel(L.LightningModule):

    def validation_step(self, batch, batch_idx):
        x, y = batch
        logits = self(x)
        loss = F.cross_entropy(logits, y)

        # 在分布式训练中同步指标
        self.log('val_loss', loss, sync_dist=True)

    def on_validation_epoch_end(self):
        # 只在主进程执行某些操作
        if self.trainer.is_global_zero:
            # 保存文件、打印日志等
            print("验证完成")

    def configure_optimizers(self):
        # 学习率根据有效 batch size 调整
        effective_batch_size = (
            self.trainer.accumulate_grad_batches *
            self.trainer.num_devices *
            self.trainer.num_nodes *
            batch_size
        )
        lr = base_lr * (effective_batch_size / 256)

        return torch.optim.AdamW(self.parameters(), lr=lr)
```

### SLURM 集群训练

```python
# SLURM 集群配置示例
trainer = L.Trainer(
    accelerator='gpu',
    devices=8,
    num_nodes=4,
    strategy='ddp',
)

# 对应的 SLURM 脚本 (submit.sh)
"""
#!/bin/bash
#SBATCH --job-name=lightning_train
#SBATCH --nodes=4
#SBATCH --gres=gpu:8
#SBATCH --ntasks-per-node=8
#SBATCH --cpus-per-task=4
#SBATCH --time=48:00:00

srun python train.py
"""
```

---

## 最佳实践

### 代码组织结构

```
project/
├── config/
│   ├── model.yaml
│   └── trainer.yaml
├── data/
│   ├── __init__.py
│   └── datamodule.py
├── models/
│   ├── __init__.py
│   ├── components/
│   │   ├── encoder.py
│   │   └── decoder.py
│   └── lightning_module.py
├── callbacks/
│   ├── __init__.py
│   └── custom_callbacks.py
├── utils/
│   └── helpers.py
├── train.py
├── test.py
└── requirements.txt
```

### 使用 LightningDataModule

```python
import lightning as L
from torch.utils.data import DataLoader, random_split
from torchvision import datasets, transforms

class CIFAR10DataModule(L.LightningDataModule):
    """CIFAR10 数据模块"""

    def __init__(
        self,
        data_dir: str = './data',
        batch_size: int = 64,
        num_workers: int = 4,
        pin_memory: bool = True,
    ):
        super().__init__()
        self.save_hyperparameters()

        self.transform_train = transforms.Compose([
            transforms.RandomHorizontalFlip(),
            transforms.RandomCrop(32, padding=4),
            transforms.ToTensor(),
            transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2023, 0.1994, 0.2010)),
        ])

        self.transform_test = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2023, 0.1994, 0.2010)),
        ])

    def prepare_data(self):
        """下载数据（仅在单进程中执行）"""
        datasets.CIFAR10(self.hparams.data_dir, train=True, download=True)
        datasets.CIFAR10(self.hparams.data_dir, train=False, download=True)

    def setup(self, stage: str = None):
        """设置数据集"""
        if stage == 'fit' or stage is None:
            cifar_full = datasets.CIFAR10(
                self.hparams.data_dir,
                train=True,
                transform=self.transform_train
            )
            self.train_dataset, self.val_dataset = random_split(
                cifar_full, [45000, 5000]
            )
            # 验证集使用测试时的变换
            self.val_dataset.dataset.transform = self.transform_test

        if stage == 'test' or stage is None:
            self.test_dataset = datasets.CIFAR10(
                self.hparams.data_dir,
                train=False,
                transform=self.transform_test
            )

        if stage == 'predict' or stage is None:
            self.predict_dataset = datasets.CIFAR10(
                self.hparams.data_dir,
                train=False,
                transform=self.transform_test
            )

    def train_dataloader(self):
        return DataLoader(
            self.train_dataset,
            batch_size=self.hparams.batch_size,
            shuffle=True,
            num_workers=self.hparams.num_workers,
            pin_memory=self.hparams.pin_memory,
            persistent_workers=True,
        )

    def val_dataloader(self):
        return DataLoader(
            self.val_dataset,
            batch_size=self.hparams.batch_size,
            shuffle=False,
            num_workers=self.hparams.num_workers,
            pin_memory=self.hparams.pin_memory,
            persistent_workers=True,
        )

    def test_dataloader(self):
        return DataLoader(
            self.test_dataset,
            batch_size=self.hparams.batch_size,
            shuffle=False,
            num_workers=self.hparams.num_workers,
            pin_memory=self.hparams.pin_memory,
        )

    def predict_dataloader(self):
        return DataLoader(
            self.predict_dataset,
            batch_size=self.hparams.batch_size,
            shuffle=False,
            num_workers=self.hparams.num_workers,
        )

# 使用数据模块
datamodule = CIFAR10DataModule(batch_size=128)
trainer = L.Trainer(max_epochs=100)
trainer.fit(model, datamodule=datamodule)
```

### 使用 Lightning CLI

```python
# train.py
from lightning.pytorch.cli import LightningCLI

def cli_main():
    cli = LightningCLI(
        LitModel,
        CIFAR10DataModule,
        save_config_callback=None,
    )

if __name__ == '__main__':
    cli_main()
```

```bash
# 命令行运行
python train.py fit \
    --model.learning_rate=1e-3 \
    --data.batch_size=128 \
    --trainer.max_epochs=100 \
    --trainer.accelerator=gpu \
    --trainer.devices=4

# 使用配置文件
python train.py fit --config config.yaml
```

### 超参数保存与加载

```python
class LitModel(L.LightningModule):
    def __init__(self, hidden_size=256, learning_rate=1e-3, dropout=0.5):
        super().__init__()
        # 自动保存所有 __init__ 参数
        self.save_hyperparameters()

        # 通过 self.hparams 访问
        self.fc = nn.Linear(784, self.hparams.hidden_size)
        self.dropout = nn.Dropout(self.hparams.dropout)

    def configure_optimizers(self):
        return torch.optim.Adam(self.parameters(), lr=self.hparams.learning_rate)

# 从检查点加载时自动恢复超参数
model = LitModel.load_from_checkpoint('path/to/checkpoint.ckpt')
print(model.hparams)  # 访问保存的超参数
```

### 生产环境部署

```python
# 导出为 TorchScript
model = LitModel.load_from_checkpoint('checkpoint.ckpt')
model.set_mode_for_inference()

# 方法1：使用 to_torchscript
script = model.to_torchscript()
torch.jit.save(script, 'model.pt')

# 方法2：导出为 ONNX
model.to_onnx(
    'model.onnx',
    input_sample=torch.randn(1, 3, 32, 32),
    export_params=True,
    opset_version=11,
)

# 加载并推理
scripted_model = torch.jit.load('model.pt')
with torch.no_grad():
    output = scripted_model(input_tensor)
```

---

## 完整项目示例

以下是一个完整的图像分类项目示例：

```python
# train.py
import lightning as L
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, random_split
from torchvision import datasets, transforms
from torchvision.models import resnet18
from torchmetrics import Accuracy
from lightning.pytorch.callbacks import (
    ModelCheckpoint,
    EarlyStopping,
    LearningRateMonitor,
    RichProgressBar,
)
from lightning.pytorch.loggers import TensorBoardLogger


class CIFAR10DataModule(L.LightningDataModule):
    """CIFAR10 数据模块"""

    def __init__(self, data_dir='./data', batch_size=64, num_workers=4):
        super().__init__()
        self.save_hyperparameters()

        self.transform_train = transforms.Compose([
            transforms.RandomHorizontalFlip(),
            transforms.RandomCrop(32, padding=4),
            transforms.ColorJitter(brightness=0.2, contrast=0.2),
            transforms.ToTensor(),
            transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2470, 0.2435, 0.2616)),
        ])

        self.transform_test = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2470, 0.2435, 0.2616)),
        ])

    def prepare_data(self):
        datasets.CIFAR10(self.hparams.data_dir, train=True, download=True)
        datasets.CIFAR10(self.hparams.data_dir, train=False, download=True)

    def setup(self, stage=None):
        if stage == 'fit' or stage is None:
            full_dataset = datasets.CIFAR10(
                self.hparams.data_dir, train=True, transform=self.transform_train
            )
            self.train_dataset, self.val_dataset = random_split(full_dataset, [45000, 5000])

        if stage == 'test' or stage is None:
            self.test_dataset = datasets.CIFAR10(
                self.hparams.data_dir, train=False, transform=self.transform_test
            )

    def train_dataloader(self):
        return DataLoader(
            self.train_dataset,
            batch_size=self.hparams.batch_size,
            shuffle=True,
            num_workers=self.hparams.num_workers,
            pin_memory=True,
            persistent_workers=True,
        )

    def val_dataloader(self):
        return DataLoader(
            self.val_dataset,
            batch_size=self.hparams.batch_size,
            shuffle=False,
            num_workers=self.hparams.num_workers,
            pin_memory=True,
        )

    def test_dataloader(self):
        return DataLoader(
            self.test_dataset,
            batch_size=self.hparams.batch_size,
            shuffle=False,
            num_workers=self.hparams.num_workers,
        )


class LitResNet(L.LightningModule):
    """ResNet 图像分类器"""

    def __init__(
        self,
        num_classes=10,
        learning_rate=1e-3,
        weight_decay=1e-4,
        warmup_epochs=5,
        max_epochs=100,
    ):
        super().__init__()
        self.save_hyperparameters()

        # 使用预训练的 ResNet18，修改最后一层
        self.model = resnet18(weights=None, num_classes=num_classes)
        # 修改第一层以适应 32x32 输入
        self.model.conv1 = nn.Conv2d(3, 64, kernel_size=3, stride=1, padding=1, bias=False)
        self.model.maxpool = nn.Identity()

        # 指标
        self.train_acc = Accuracy(task='multiclass', num_classes=num_classes)
        self.val_acc = Accuracy(task='multiclass', num_classes=num_classes)
        self.test_acc = Accuracy(task='multiclass', num_classes=num_classes)

    def forward(self, x):
        return self.model(x)

    def training_step(self, batch, batch_idx):
        x, y = batch
        logits = self(x)
        loss = F.cross_entropy(logits, y)
        preds = torch.argmax(logits, dim=1)

        self.train_acc(preds, y)
        self.log('train_loss', loss, on_step=True, on_epoch=True, prog_bar=True)
        self.log('train_acc', self.train_acc, on_step=False, on_epoch=True, prog_bar=True)

        return loss

    def validation_step(self, batch, batch_idx):
        x, y = batch
        logits = self(x)
        loss = F.cross_entropy(logits, y)
        preds = torch.argmax(logits, dim=1)

        self.val_acc(preds, y)
        self.log('val_loss', loss, on_epoch=True, prog_bar=True)
        self.log('val_acc', self.val_acc, on_epoch=True, prog_bar=True)

    def test_step(self, batch, batch_idx):
        x, y = batch
        logits = self(x)
        loss = F.cross_entropy(logits, y)
        preds = torch.argmax(logits, dim=1)

        self.test_acc(preds, y)
        self.log('test_loss', loss)
        self.log('test_acc', self.test_acc)

    def configure_optimizers(self):
        optimizer = torch.optim.AdamW(
            self.parameters(),
            lr=self.hparams.learning_rate,
            weight_decay=self.hparams.weight_decay,
        )

        # 带 warmup 的余弦退火调度器
        scheduler = torch.optim.lr_scheduler.OneCycleLR(
            optimizer,
            max_lr=self.hparams.learning_rate,
            total_steps=self.trainer.estimated_stepping_batches,
            pct_start=self.hparams.warmup_epochs / self.hparams.max_epochs,
            anneal_strategy='cos',
        )

        return {
            'optimizer': optimizer,
            'lr_scheduler': {
                'scheduler': scheduler,
                'interval': 'step',
            }
        }


def main():
    # 设置随机种子以确保可复现性
    L.seed_everything(42, workers=True)

    # 初始化数据模块
    datamodule = CIFAR10DataModule(
        data_dir='./data',
        batch_size=128,
        num_workers=4,
    )

    # 初始化模型
    model = LitResNet(
        num_classes=10,
        learning_rate=1e-3,
        weight_decay=1e-4,
        warmup_epochs=5,
        max_epochs=100,
    )

    # 配置回调
    callbacks = [
        ModelCheckpoint(
            dirpath='checkpoints/',
            filename='resnet-{epoch:02d}-{val_acc:.4f}',
            monitor='val_acc',
            mode='max',
            save_top_k=3,
            save_last=True,
        ),
        EarlyStopping(
            monitor='val_acc',
            patience=15,
            mode='max',
        ),
        LearningRateMonitor(logging_interval='step'),
        RichProgressBar(),
    ]

    # 配置日志器
    logger = TensorBoardLogger(
        save_dir='logs/',
        name='cifar10_resnet',
    )

    # 初始化训练器
    trainer = L.Trainer(
        max_epochs=100,
        accelerator='auto',
        devices='auto',
        precision='16-mixed',
        callbacks=callbacks,
        logger=logger,
        deterministic=True,
        gradient_clip_val=1.0,
    )

    # 训练
    trainer.fit(model, datamodule=datamodule)

    # 测试
    trainer.test(model, datamodule=datamodule, ckpt_path='best')

    print(f"最佳模型路径: {callbacks[0].best_model_path}")
    print(f"最佳验证准确率: {callbacks[0].best_model_score:.4f}")


if __name__ == '__main__':
    main()
```

---

## 总结

PyTorch Lightning 通过以下方式简化深度学习开发：

1. **代码组织**：将研究代码与工程代码分离，提高代码可读性和可维护性
2. **自动化**：自动处理训练循环、设备管理、分布式训练等工程细节
3. **灵活性**：在提供便利的同时保持完全的灵活性，可以随时访问底层 PyTorch
4. **可扩展性**：通过回调系统轻松添加自定义功能
5. **可复现性**：内置随机种子管理和检查点保存
6. **生态系统**：与主流 ML 工具（TensorBoard、W&B、MLflow 等）无缝集成

掌握 PyTorch Lightning 可以让你更专注于模型设计和实验，而不是重复编写训练代码，从而大大提高深度学习项目的开发效率。
