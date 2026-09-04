---
title: 深度学习进阶：训练技术
description: 掌握深度学习训练技术：学习率调度、混合精度和分布式训练
track: ai
section: deep-learning
difficulty: advanced
tags:
  - training
  - learning rate
  - mixed precision
  - distributed
status: imported
origin: old/src/content/docs/datascience/training-techniques.zh.md
divergence: 0.211
issues: []
legacy:
  category: DataScience
  subcategory: DeepLearning
  order: 18
  lastUpdated: 2026-01-07
---

有效训练深度神经网络需要掌握超越基本梯度下降的各种技术。本综合指南涵盖了实现最先进性能、减少训练时间以及扩展到大型模型和数据集所必需的高级训练策略。

---

## 学习率调度

学习率可以说是深度学习中最重要的超参数。一个精心设计的学习率调度可以显著提高收敛速度和最终模型性能。

### 为什么学习率调度很重要

- **太高**：训练可能发散或在最小值附近振荡
- **太低**：训练缓慢，可能陷入局部最小值
- **动态调度**：允许早期激进探索和后期精细优化

### Step Decay 调度器

Step decay 在固定间隔以某个因子降低学习率。

```python
import torch
import torch.optim as optim
import matplotlib.pyplot as plt

# 创建简单模型和优化器
model = torch.nn.Linear(10, 1)
optimizer = optim.SGD(model.parameters(), lr=0.1)

# StepLR：每 step_size 个 epoch 将学习率乘以 gamma
scheduler = optim.lr_scheduler.StepLR(
    optimizer,
    step_size=30,  # 每 30 个 epoch 衰减一次
    gamma=0.1      # 学习率乘以 0.1
)

# 追踪学习率
lrs = []
for epoch in range(100):
    lrs.append(optimizer.param_groups[0]['lr'])
    # 训练步骤在这里
    optimizer.step()
    scheduler.step()

# 可视化
plt.figure(figsize=(10, 4))
plt.plot(lrs)
plt.xlabel('Epoch')
plt.ylabel('Learning Rate')
plt.title('Step Decay 学习率调度')
plt.grid(True)
plt.savefig('step_decay_lr.png')
```

### MultiStep Decay

为了获得更多控制，可以指定衰减发生的确切 epoch：

```python
# MultiStepLR：在特定里程碑处衰减
scheduler = optim.lr_scheduler.MultiStepLR(
    optimizer,
    milestones=[30, 60, 80],  # 在 epoch 30、60 和 80 时衰减
    gamma=0.1
)

# ImageNet 训练的常见模式
scheduler = optim.lr_scheduler.MultiStepLR(
    optimizer,
    milestones=[30, 60, 90],
    gamma=0.1
)
```

### 余弦退火调度器

余弦退火提供遵循余弦曲线的平滑学习率衰减，通常能带来更好的收敛。

**数学公式：**

$$\eta_t = \eta_{min} + \frac{1}{2}(\eta_{max} - \eta_{min})\left(1 + \cos\left(\frac{T_{cur}}{T_{max}}\pi\right)\right)$$

```python
# CosineAnnealingLR
scheduler = optim.lr_scheduler.CosineAnnealingLR(
    optimizer,
    T_max=100,      # 总 epoch 数
    eta_min=1e-6    # 最小学习率
)

# 追踪和可视化
lrs = []
for epoch in range(100):
    lrs.append(optimizer.param_groups[0]['lr'])
    optimizer.step()
    scheduler.step()

plt.figure(figsize=(10, 4))
plt.plot(lrs)
plt.xlabel('Epoch')
plt.ylabel('Learning Rate')
plt.title('余弦退火学习率调度')
plt.grid(True)
```

### 带热重启的余弦退火

定期重置学习率以逃离局部最小值：

```python
# CosineAnnealingWarmRestarts
scheduler = optim.lr_scheduler.CosineAnnealingWarmRestarts(
    optimizer,
    T_0=10,      # 第一次重启的 epoch 数
    T_mult=2,    # 每次重启后 T_i 的增长因子
    eta_min=1e-6
)

# 100 个 epoch 的示例调度，T_0=10, T_mult=2：
# 重启于：10, 30, 70, ...
```

### 预热策略

预热在训练初始阶段将学习率从小值逐渐增加到目标值。这对以下情况至关重要：

- 使用大批量时稳定训练
- 防止早期发散
- 提高 transformer 模型的最终性能

```python
import math

class WarmupScheduler:
    """线性预热调度器"""
    def __init__(self, optimizer, warmup_epochs, target_lr):
        self.optimizer = optimizer
        self.warmup_epochs = warmup_epochs
        self.target_lr = target_lr
        self.current_epoch = 0

        # 从非常小的学习率开始
        for param_group in optimizer.param_groups:
            param_group['lr'] = target_lr / warmup_epochs

    def step(self):
        self.current_epoch += 1
        if self.current_epoch <= self.warmup_epochs:
            lr = self.target_lr * self.current_epoch / self.warmup_epochs
            for param_group in self.optimizer.param_groups:
                param_group['lr'] = lr


class WarmupCosineScheduler:
    """预热后接余弦退火 - transformer 训练中常见"""
    def __init__(self, optimizer, warmup_epochs, total_epochs,
                 warmup_start_lr=1e-8, min_lr=1e-6):
        self.optimizer = optimizer
        self.warmup_epochs = warmup_epochs
        self.total_epochs = total_epochs
        self.warmup_start_lr = warmup_start_lr
        self.min_lr = min_lr
        self.base_lr = optimizer.param_groups[0]['lr']
        self.current_epoch = 0

    def step(self):
        self.current_epoch += 1

        if self.current_epoch <= self.warmup_epochs:
            # 线性预热
            lr = self.warmup_start_lr + (self.base_lr - self.warmup_start_lr) * \
                 (self.current_epoch / self.warmup_epochs)
        else:
            # 余弦退火
            progress = (self.current_epoch - self.warmup_epochs) / \
                      (self.total_epochs - self.warmup_epochs)
            lr = self.min_lr + (self.base_lr - self.min_lr) * \
                 0.5 * (1 + math.cos(math.pi * progress))

        for param_group in self.optimizer.param_groups:
            param_group['lr'] = lr

        return lr


# 使用 PyTorch 内置的 LinearLR 进行预热，结合其他调度器
from torch.optim.lr_scheduler import LinearLR, CosineAnnealingLR, SequentialLR

optimizer = optim.AdamW(model.parameters(), lr=1e-3)

# 预热 5 个 epoch，然后余弦退火 95 个 epoch
warmup_scheduler = LinearLR(
    optimizer,
    start_factor=0.01,  # 从基础学习率的 1% 开始
    end_factor=1.0,     # 结束于基础学习率的 100%
    total_iters=5
)
cosine_scheduler = CosineAnnealingLR(optimizer, T_max=95, eta_min=1e-6)

scheduler = SequentialLR(
    optimizer,
    schedulers=[warmup_scheduler, cosine_scheduler],
    milestones=[5]
)
```

### OneCycleLR

最有效的调度器之一，将预热和退火结合在单个周期中：

```python
# OneCycleLR - 强烈推荐用于许多任务
scheduler = optim.lr_scheduler.OneCycleLR(
    optimizer,
    max_lr=0.01,              # 峰值学习率
    epochs=100,
    steps_per_epoch=len(train_loader),
    pct_start=0.3,            # 用于增加学习率的周期百分比
    anneal_strategy='cos',    # 'cos' 或 'linear'
    div_factor=25,            # initial_lr = max_lr / div_factor
    final_div_factor=1e4      # final_lr = initial_lr / final_div_factor
)

# 重要：每个 batch 后调用 scheduler.step()，而不是每个 epoch
for epoch in range(epochs):
    for batch in train_loader:
        # 训练步骤
        loss = train_step(batch)
        optimizer.step()
        scheduler.step()  # 每个 batch 更新！
```

### 学习率查找器

在训练前找到最佳学习率范围：

```python
def lr_finder(model, train_loader, optimizer, criterion,
              start_lr=1e-7, end_lr=10, num_iter=100):
    """
    学习率范围测试以找到最佳学习率。
    基于: https://arxiv.org/abs/1506.01186
    """
    model.train()

    # 保存初始状态
    initial_state = {
        'model': model.state_dict(),
        'optimizer': optimizer.state_dict()
    }

    # 计算学习率乘法因子
    lr_mult = (end_lr / start_lr) ** (1 / num_iter)
    lr = start_lr

    lrs = []
    losses = []
    best_loss = float('inf')

    optimizer.param_groups[0]['lr'] = lr

    iterator = iter(train_loader)
    for i in range(num_iter):
        try:
            batch = next(iterator)
        except StopIteration:
            iterator = iter(train_loader)
            batch = next(iterator)

        data, target = batch
        data, target = data.cuda(), target.cuda()

        optimizer.zero_grad()
        output = model(data)
        loss = criterion(output, target)

        # 如果损失爆炸则停止
        if loss.item() > 4 * best_loss or torch.isnan(loss):
            break

        if loss.item() < best_loss:
            best_loss = loss.item()

        losses.append(loss.item())
        lrs.append(lr)

        loss.backward()
        optimizer.step()

        # 更新学习率
        lr *= lr_mult
        optimizer.param_groups[0]['lr'] = lr

    # 恢复初始状态
    model.load_state_dict(initial_state['model'])
    optimizer.load_state_dict(initial_state['optimizer'])

    # 绘制结果
    plt.figure(figsize=(10, 4))
    plt.semilogx(lrs, losses)
    plt.xlabel('Learning Rate')
    plt.ylabel('Loss')
    plt.title('学习率查找器')
    plt.grid(True)
    plt.savefig('lr_finder.png')

    return lrs, losses
```

---

## 混合精度训练

混合精度训练使用较低精度的浮点格式（FP16）进行大多数操作，同时在必要时保持 FP32 精度。这种方法可以：

- **减少内存使用**最多 50%
- **加速训练** 2-3 倍（在现代 GPU 上）
- **启用更大的批量大小**
- **保持模型精度**

### 理解精度格式

| 格式 | 位数 | 范围 | 精度 |
|------|-----|------|-----|
| FP32 (float) | 32 | ~1e-38 到 1e38 | ~7 位十进制数字 |
| FP16 (half) | 16 | ~6e-5 到 65504 | ~3 位十进制数字 |
| BF16 (bfloat16) | 16 | ~1e-38 到 1e38 | ~3 位十进制数字 |

### PyTorch 自动混合精度 (AMP)

PyTorch 提供 `torch.cuda.amp` 用于简单的混合精度训练：

```python
import torch
from torch.cuda.amp import autocast, GradScaler

def train_with_amp(model, train_loader, optimizer, criterion,
                   device='cuda', accumulation_steps=1):
    """
    使用自动混合精度的训练循环。
    """
    model.train()
    scaler = GradScaler()

    total_loss = 0
    optimizer.zero_grad()

    for batch_idx, (data, target) in enumerate(train_loader):
        data, target = data.to(device), target.to(device)

        # 使用 autocast 进行前向传播
        with autocast():
            output = model(data)
            loss = criterion(output, target)
            loss = loss / accumulation_steps  # 为梯度累积缩放

        # 使用缩放梯度进行反向传播
        scaler.scale(loss).backward()

        # 每 accumulation_steps 更新一次权重
        if (batch_idx + 1) % accumulation_steps == 0:
            # 在裁剪前取消梯度缩放
            scaler.unscale_(optimizer)

            # 梯度裁剪
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)

            # 使用 scaler 进行优化器步骤
            scaler.step(optimizer)
            scaler.update()

            optimizer.zero_grad()

        total_loss += loss.item() * accumulation_steps

    return total_loss / len(train_loader)
```

### 完整的 AMP 训练器类

```python
class AMPTrainer:
    """支持 AMP 的完整训练器类"""

    def __init__(self, model, train_loader, val_loader, criterion,
                 optimizer, scheduler=None, device='cuda'):
        self.model = model.to(device)
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.criterion = criterion
        self.optimizer = optimizer
        self.scheduler = scheduler
        self.device = device

        # 为 AMP 初始化 GradScaler
        self.scaler = GradScaler()

        # 指标追踪
        self.train_losses = []
        self.val_losses = []
        self.best_val_loss = float('inf')

    def train_epoch(self):
        self.model.train()
        total_loss = 0
        correct = 0
        total = 0

        for data, target in self.train_loader:
            data, target = data.to(self.device), target.to(self.device)

            self.optimizer.zero_grad()

            # 混合精度前向传播
            with autocast():
                output = self.model(data)
                loss = self.criterion(output, target)

            # 缩放的反向传播
            self.scaler.scale(loss).backward()

            # 梯度裁剪前取消缩放
            self.scaler.unscale_(self.optimizer)
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)

            # 优化器步骤
            self.scaler.step(self.optimizer)
            self.scaler.update()

            # 指标
            total_loss += loss.item()
            pred = output.argmax(dim=1)
            correct += pred.eq(target).sum().item()
            total += target.size(0)

        return total_loss / len(self.train_loader), correct / total

    @torch.no_grad()
    def validate(self):
        self.model.eval()
        total_loss = 0
        correct = 0
        total = 0

        for data, target in self.val_loader:
            data, target = data.to(self.device), target.to(self.device)

            # 验证也使用 autocast
            with autocast():
                output = self.model(data)
                loss = self.criterion(output, target)

            total_loss += loss.item()
            pred = output.argmax(dim=1)
            correct += pred.eq(target).sum().item()
            total += target.size(0)

        return total_loss / len(self.val_loader), correct / total
```

### BFloat16 训练

BFloat16 具有与 FP32 相同的动态范围，但精度降低。它对训练特别有用，并且在较新的 GPU（Ampere+）上受支持：

```python
# BFloat16 训练（需要 Ampere 或更新的 GPU）
with autocast(dtype=torch.bfloat16):
    output = model(data)
    loss = criterion(output, target)

# 注意：由于更大的动态范围，BFloat16 通常不需要 GradScaler
# 但是，为了稳定性仍然建议使用
```

### AMP 最佳实践

```python
# 在 FP16 中安全的操作
safe_fp16_ops = [
    'torch.nn.Linear',
    'torch.nn.Conv2d',
    'torch.nn.Conv1d',
    'torch.matmul',
    'torch.bmm',
]

# 应该保持在 FP32 的操作
keep_fp32_ops = [
    'torch.nn.LayerNorm',
    'torch.nn.BatchNorm2d',
    'torch.nn.Softmax',
    'torch.nn.CrossEntropyLoss',
    'torch.log',
    'torch.exp',
    'torch.pow',
]

# 特定操作的自定义 autocast 上下文
@torch.cuda.amp.custom_fwd(cast_inputs=torch.float32)
def stable_softmax(x):
    """强制使用 FP32 以保证数值稳定性"""
    return torch.nn.functional.softmax(x, dim=-1)
```

---

## 梯度累积

梯度累积允许在多次前向-反向传播中累积梯度后再更新权重，从而实现比 GPU 内存允许的更大的有效批量大小进行训练。

### 为什么使用梯度累积？

- **内存限制**：在有限的 GPU 内存上使用大的有效批量大小训练
- **批量大小敏感性**：某些模型（特别是 transformer）受益于大批量大小
- **多 GPU 模拟**：在单个 GPU 上模拟多 GPU 训练

### 实现

```python
def train_with_gradient_accumulation(
    model,
    train_loader,
    optimizer,
    criterion,
    accumulation_steps=4,
    device='cuda'
):
    """
    使用梯度累积进行训练。

    有效批量大小 = 实际批量大小 * accumulation_steps

    例如：batch_size=16, accumulation_steps=4 -> effective_batch_size=64
    """
    model.train()
    optimizer.zero_grad()

    total_loss = 0
    accumulated_loss = 0

    for batch_idx, (data, target) in enumerate(train_loader):
        data, target = data.to(device), target.to(device)

        # 前向传播
        output = model(data)
        loss = criterion(output, target)

        # 按累积步数归一化损失
        # 这确保梯度被正确缩放
        loss = loss / accumulation_steps

        # 反向传播（累积梯度）
        loss.backward()

        accumulated_loss += loss.item()

        # 每 accumulation_steps 个 batch 更新一次权重
        if (batch_idx + 1) % accumulation_steps == 0:
            # 可选：梯度裁剪
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)

            # 更新参数
            optimizer.step()
            optimizer.zero_grad()

            total_loss += accumulated_loss
            accumulated_loss = 0

    # 如果数据集大小不能被 accumulation_steps 整除，处理剩余批次
    if (batch_idx + 1) % accumulation_steps != 0:
        optimizer.step()
        optimizer.zero_grad()
        total_loss += accumulated_loss

    return total_loss / (len(train_loader) // accumulation_steps)
```

### 梯度累积时的学习率缩放

使用梯度累积时，可能需要调整学习率：

```python
def get_scaled_lr(base_lr, base_batch_size, effective_batch_size):
    """
    学习率的线性缩放规则。

    参考："Accurate, Large Minibatch SGD: Training ImageNet in 1 Hour"
    """
    return base_lr * (effective_batch_size / base_batch_size)

# 使用示例
base_lr = 0.001
base_batch_size = 32
actual_batch_size = 8
accumulation_steps = 16

effective_batch_size = actual_batch_size * accumulation_steps  # 128
scaled_lr = get_scaled_lr(base_lr, base_batch_size, effective_batch_size)
print(f"缩放后的学习率: {scaled_lr}")  # 0.004
```

---

## 梯度裁剪

梯度裁剪通过在训练期间限制梯度值来防止梯度爆炸。这对于训练 RNN、LSTM 和 transformer 模型至关重要。

### 梯度裁剪的类型

#### 梯度范数裁剪

如果梯度的总范数超过阈值，则进行缩放：

```python
import torch

def clip_gradient_norm(model, max_norm, norm_type=2):
    """
    按总范数裁剪梯度。

    如果 ||g|| > max_norm，则缩放：g = g * (max_norm / ||g||)
    """
    total_norm = torch.nn.utils.clip_grad_norm_(
        model.parameters(),
        max_norm=max_norm,
        norm_type=norm_type  # 默认 L2 范数
    )
    return total_norm

# 在训练循环中使用
optimizer.zero_grad()
loss.backward()

# 在优化器步骤前裁剪梯度
total_norm = clip_gradient_norm(model, max_norm=1.0)
print(f"梯度范数: {total_norm:.4f}")

optimizer.step()
```

#### 梯度值裁剪

将每个梯度元素裁剪到最大绝对值：

```python
def clip_gradient_value(model, clip_value):
    """
    将每个梯度元素裁剪到 [-clip_value, clip_value]。
    """
    torch.nn.utils.clip_grad_value_(
        model.parameters(),
        clip_value=clip_value
    )

# 使用
optimizer.zero_grad()
loss.backward()
clip_gradient_value(model, clip_value=0.5)
optimizer.step()
```

### 自适应梯度裁剪 (AGC)

AGC 基于梯度范数与参数范数的比率进行裁剪：

```python
def adaptive_gradient_clipping(model, clip_factor=0.01, eps=1e-3):
    """
    来自 NFNet 论文的自适应梯度裁剪。

    基于参数级单位范数裁剪梯度。
    参考："High-Performance Large-Scale Image Recognition Without Normalization"
    """
    for param in model.parameters():
        if param.grad is None:
            continue

        # 计算参数范数（对于 conv/linear 层按单元计算）
        param_norm = param.data.norm(dim=tuple(range(1, param.dim())), keepdim=True)
        grad_norm = param.grad.norm(dim=tuple(range(1, param.grad.dim())), keepdim=True)

        # 计算允许的最大梯度范数
        max_norm = param_norm * clip_factor

        # 如果梯度范数超过最大值则裁剪
        trigger = grad_norm > max_norm
        clipped_grad = param.grad * (max_norm / (grad_norm + eps))
        param.grad.data.copy_(torch.where(trigger, clipped_grad, param.grad))
```

### 梯度监控

```python
class GradientMonitor:
    """训练期间监控梯度统计"""

    def __init__(self, model):
        self.model = model
        self.grad_history = {name: [] for name, _ in model.named_parameters()}

    def record_gradients(self):
        """记录所有参数的梯度范数"""
        stats = {}
        total_norm = 0

        for name, param in self.model.named_parameters():
            if param.grad is not None:
                grad_norm = param.grad.data.norm().item()
                self.grad_history[name].append(grad_norm)
                stats[name] = grad_norm
                total_norm += grad_norm ** 2

        stats['total_norm'] = total_norm ** 0.5
        return stats

    def check_gradient_health(self):
        """检查梯度消失或爆炸"""
        issues = []

        for name, param in self.model.named_parameters():
            if param.grad is not None:
                grad_norm = param.grad.data.norm().item()

                if grad_norm < 1e-7:
                    issues.append(f"{name} 中梯度消失: {grad_norm:.2e}")
                elif grad_norm > 1e3:
                    issues.append(f"{name} 中梯度爆炸: {grad_norm:.2e}")
                elif torch.isnan(param.grad).any():
                    issues.append(f"{name} 中出现 NaN 梯度")

        return issues
```

---

## 分布式数据并行 (DDP)

DDP 是 PyTorch 中推荐的分布式训练方法。它使用 all-reduce 操作在多个 GPU/节点之间高效同步梯度。

### DDP 架构

- 每个进程运行模型的独立副本
- 每次反向传播后，梯度同步（取平均）
- 所有进程以相同方式更新模型

### 单节点多 GPU 训练

```python
import os
import torch
import torch.nn as nn
import torch.distributed as dist
import torch.multiprocessing as mp
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.utils.data import DataLoader, DistributedSampler

def setup(rank, world_size):
    """初始化分布式环境"""
    os.environ['MASTER_ADDR'] = 'localhost'
    os.environ['MASTER_PORT'] = '12355'

    # 初始化进程组
    dist.init_process_group(
        backend='nccl',  # GPU 训练使用 NCCL 后端
        init_method='env://',
        world_size=world_size,
        rank=rank
    )

    # 为此进程设置设备
    torch.cuda.set_device(rank)

def cleanup():
    """清理分布式环境"""
    dist.destroy_process_group()

def train_ddp(rank, world_size, dataset, model_class, epochs):
    """
    DDP 中每个进程的训练函数。

    参数:
        rank: 此进程的唯一标识符
        world_size: 总进程数
        dataset: 训练数据集
        model_class: 要实例化的模型类
        epochs: 训练 epoch 数
    """
    # 设置分布式环境
    setup(rank, world_size)

    # 创建模型并移动到 GPU
    model = model_class().to(rank)

    # 用 DDP 包装模型
    ddp_model = DDP(model, device_ids=[rank])

    # 创建分布式采样器
    sampler = DistributedSampler(
        dataset,
        num_replicas=world_size,
        rank=rank,
        shuffle=True
    )

    # 使用分布式采样器创建 dataloader
    dataloader = DataLoader(
        dataset,
        batch_size=32,
        sampler=sampler,
        num_workers=4,
        pin_memory=True
    )

    # 损失函数和优化器
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(ddp_model.parameters(), lr=1e-3)

    # 训练循环
    for epoch in range(epochs):
        # 重要：为采样器设置 epoch 以确保正确 shuffle
        sampler.set_epoch(epoch)

        ddp_model.train()
        total_loss = 0

        for batch_idx, (data, target) in enumerate(dataloader):
            data, target = data.to(rank), target.to(rank)

            optimizer.zero_grad()
            output = ddp_model(data)
            loss = criterion(output, target)
            loss.backward()
            optimizer.step()

            total_loss += loss.item()

        # 只从 rank 0 打印
        if rank == 0:
            avg_loss = total_loss / len(dataloader)
            print(f'Epoch {epoch+1}/{epochs}, Loss: {avg_loss:.4f}')

    # 保存模型（只从 rank 0）
    if rank == 0:
        torch.save(ddp_model.module.state_dict(), 'model_ddp.pt')

    cleanup()

def main():
    """启动分布式训练"""
    world_size = torch.cuda.device_count()
    print(f"在 {world_size} 个 GPU 上训练")

    # 生成进程
    mp.spawn(
        train_ddp,
        args=(world_size, dataset, ModelClass, 10),
        nprocs=world_size,
        join=True
    )

if __name__ == '__main__':
    main()
```

### 多节点训练

```python
import os
import torch
import torch.distributed as dist

def setup_multi_node():
    """
    多节点训练设置。

    需要的环境变量:
    - MASTER_ADDR: 主节点 IP 地址
    - MASTER_PORT: 主节点端口
    - WORLD_SIZE: 总进程数
    - RANK: 此进程的全局 rank
    - LOCAL_RANK: 此节点上的本地 rank
    """
    # 获取环境变量
    rank = int(os.environ['RANK'])
    world_size = int(os.environ['WORLD_SIZE'])
    local_rank = int(os.environ['LOCAL_RANK'])

    # 初始化进程组
    dist.init_process_group(
        backend='nccl',
        init_method='env://',
        world_size=world_size,
        rank=rank
    )

    # 设置设备
    torch.cuda.set_device(local_rank)

    return rank, world_size, local_rank


# 多节点训练启动命令:
# 节点 0: torchrun --nproc_per_node=4 --nnodes=2 --node_rank=0 \
#                  --master_addr="192.168.1.1" --master_port=12355 train.py
# 节点 1: torchrun --nproc_per_node=4 --nnodes=2 --node_rank=1 \
#                  --master_addr="192.168.1.1" --master_port=12355 train.py
```

### DDP 与 AMP 结合

```python
from torch.cuda.amp import autocast, GradScaler

def train_ddp_amp(rank, world_size, dataset, model_class, epochs):
    """带自动混合精度的 DDP 训练"""
    setup(rank, world_size)

    model = model_class().to(rank)
    ddp_model = DDP(model, device_ids=[rank])

    sampler = DistributedSampler(dataset, num_replicas=world_size, rank=rank)
    dataloader = DataLoader(dataset, batch_size=32, sampler=sampler)

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(ddp_model.parameters(), lr=1e-3)
    scaler = GradScaler()

    for epoch in range(epochs):
        sampler.set_epoch(epoch)
        ddp_model.train()

        for data, target in dataloader:
            data, target = data.to(rank), target.to(rank)

            optimizer.zero_grad()

            with autocast():
                output = ddp_model(data)
                loss = criterion(output, target)

            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()

    cleanup()
```

### 实用 DDP 工具

```python
def reduce_tensor(tensor, world_size):
    """在所有进程间平均张量"""
    rt = tensor.clone()
    dist.all_reduce(rt, op=dist.ReduceOp.SUM)
    rt /= world_size
    return rt

def gather_tensors(tensor, world_size, rank):
    """从所有进程收集张量"""
    gathered = [torch.zeros_like(tensor) for _ in range(world_size)]
    dist.all_gather(gathered, tensor)
    return gathered

def broadcast_tensor(tensor, src=0):
    """从源进程广播张量到所有进程"""
    dist.broadcast(tensor, src=src)
    return tensor

class SyncBatchNorm:
    """将 BatchNorm 转换为 DDP 的 SyncBatchNorm"""

    @staticmethod
    def convert(model):
        """将所有 BatchNorm 层转换为 SyncBatchNorm"""
        return nn.SyncBatchNorm.convert_sync_batchnorm(model)
```

---

## 模型并行

模型并行将模型分布到多个 GPU 上，允许训练无法放入单个 GPU 内存的模型。

### 模型并行的类型

1. **张量并行**：将单个层分布到 GPU 上
2. **流水线并行**：将模型分成跨 GPU 的阶段
3. **序列并行**：将序列维度分布到 GPU 上

### 基本模型并行

```python
import torch
import torch.nn as nn

class ModelParallelNetwork(nn.Module):
    """
    简单的模型并行：在两个 GPU 之间分割模型。
    """

    def __init__(self, num_classes=1000):
        super().__init__()

        # 前半部分在 GPU 0
        self.seq1 = nn.Sequential(
            nn.Linear(1024, 2048),
            nn.ReLU(),
            nn.Linear(2048, 2048),
            nn.ReLU(),
        ).to('cuda:0')

        # 后半部分在 GPU 1
        self.seq2 = nn.Sequential(
            nn.Linear(2048, 2048),
            nn.ReLU(),
            nn.Linear(2048, num_classes),
        ).to('cuda:1')

    def forward(self, x):
        # 在 GPU 0 上进行前半部分前向传播
        x = self.seq1(x.to('cuda:0'))

        # 传输到 GPU 1 并进行后半部分前向传播
        x = self.seq2(x.to('cuda:1'))

        return x


# 使用模型并行进行训练
model = ModelParallelNetwork()
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.SGD(model.parameters(), lr=0.01)

for data, target in dataloader:
    # 数据从 CPU 开始
    data = data.to('cuda:0')  # 输入到第一个 GPU
    target = target.to('cuda:1')  # 标签到最后一个 GPU（输出所在位置）

    optimizer.zero_grad()
    output = model(data)
    loss = criterion(output, target)
    loss.backward()
    optimizer.step()
```

### 张量并行

将单个层（特别是大型线性层）分割到多个 GPU：

```python
class ColumnParallelLinear(nn.Module):
    """
    列并行的线性层。

    沿列（输出维度）分割权重矩阵。
    每个 GPU 计算输出的一部分。
    """

    def __init__(self, in_features, out_features, world_size, rank):
        super().__init__()
        self.world_size = world_size
        self.rank = rank

        # 每个 GPU 处理 out_features // world_size 列
        self.out_features_per_gpu = out_features // world_size
        self.linear = nn.Linear(in_features, self.out_features_per_gpu)

    def forward(self, x):
        # 每个 GPU 计算其部分
        local_output = self.linear(x)

        # 从所有 GPU 收集输出
        output_list = [torch.zeros_like(local_output) for _ in range(self.world_size)]
        dist.all_gather(output_list, local_output)

        # 沿输出维度拼接
        return torch.cat(output_list, dim=-1)


class RowParallelLinear(nn.Module):
    """
    行并行的线性层。

    沿行（输入维度）分割权重矩阵。
    输入必须在 GPU 之间分割。
    """

    def __init__(self, in_features, out_features, world_size, rank):
        super().__init__()
        self.world_size = world_size
        self.rank = rank

        # 每个 GPU 处理 in_features // world_size 行
        self.in_features_per_gpu = in_features // world_size
        self.linear = nn.Linear(self.in_features_per_gpu, out_features, bias=(rank == 0))

    def forward(self, x):
        # x 已经分割：每个 GPU 有 in_features_per_gpu 个特征
        local_output = self.linear(x)

        # 在 GPU 之间求和输出
        dist.all_reduce(local_output, op=dist.ReduceOp.SUM)

        return local_output
```

---

## 流水线并行

流水线并行将模型分成多个阶段，并以流水线方式处理微批次以提高 GPU 利用率。

### 概念

```
时间 ->
GPU 0: [F1] [F2] [F3] [F4] [B4] [B3] [B2] [B1]
GPU 1:      [F1] [F2] [F3] [B3] [B2] [B1] [B4]
GPU 2:           [F1] [F2] [B2] [B1] [B4] [B3]
GPU 3:                [F1] [B1] [B4] [B3] [B2]

F = 前向传播, B = 反向传播, 数字 = 微批次索引
```

### PyTorch 实现

```python
from torch.distributed.pipeline.sync import Pipe

class PipelineModel(nn.Module):
    """为流水线并行设计的模型"""

    def __init__(self):
        super().__init__()

        # 定义阶段
        self.stage1 = nn.Sequential(
            nn.Linear(1024, 2048),
            nn.ReLU(),
            nn.Linear(2048, 2048),
        )

        self.stage2 = nn.Sequential(
            nn.Linear(2048, 2048),
            nn.ReLU(),
            nn.Linear(2048, 2048),
        )

        self.stage3 = nn.Sequential(
            nn.Linear(2048, 2048),
            nn.ReLU(),
            nn.Linear(2048, 1024),
        )

        self.stage4 = nn.Sequential(
            nn.Linear(1024, 512),
            nn.ReLU(),
            nn.Linear(512, 10),
        )

    def forward(self, x):
        x = self.stage1(x)
        x = self.stage2(x)
        x = self.stage3(x)
        x = self.stage4(x)
        return x


def setup_pipeline(model, chunks=8):
    """
    使用 Pipe 设置流水线并行。

    参数:
        model: 要并行化的模型
        chunks: 微批次数量（更高 = GPU 利用率更好）
    """
    # 将阶段移动到不同的 GPU
    model.stage1.to('cuda:0')
    model.stage2.to('cuda:1')
    model.stage3.to('cuda:2')
    model.stage4.to('cuda:3')

    # 用 Pipe 包装
    model = Pipe(
        nn.Sequential(
            model.stage1,
            model.stage2,
            model.stage3,
            model.stage4,
        ),
        chunks=chunks,
        checkpoint='never'  # 或 'always' 以提高内存效率
    )

    return model
```

### GPipe 风格实现

```python
class GPipeSchedule:
    """
    GPipe 风格的流水线调度。

    将小批次分割成微批次并以流水线方式处理。
    """

    def __init__(self, stages, num_microbatches):
        self.stages = stages  # 不同 GPU 上的 nn.Module 列表
        self.num_stages = len(stages)
        self.num_microbatches = num_microbatches

    def forward_backward(self, batch, labels, criterion):
        """
        使用流水线调度执行前向和反向传播。
        """
        batch_size = batch.size(0)
        microbatch_size = batch_size // self.num_microbatches

        # 分割成微批次
        microbatches = batch.split(microbatch_size)
        labels_split = labels.split(microbatch_size)

        # 存储激活值
        activations = [{} for _ in range(self.num_stages)]

        total_loss = 0

        # 前向传播 - 填充流水线
        for mb_idx, (mb, mb_labels) in enumerate(zip(microbatches, labels_split)):
            x = mb
            for stage_idx, stage in enumerate(self.stages):
                device = next(stage.parameters()).device
                x = x.to(device)
                x = stage(x)
                activations[stage_idx][mb_idx] = x

            # 计算此微批次的损失
            loss = criterion(x, mb_labels.to(x.device))
            total_loss += loss

        # 反向传播
        total_loss.backward()

        return total_loss.item() / self.num_microbatches
```

---

## 完整训练流程

这是一个结合所有技术的完整、生产就绪的训练流程：

```python
import os
import math
import torch
import torch.nn as nn
import torch.optim as optim
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.utils.data import DataLoader, DistributedSampler
from torch.cuda.amp import autocast, GradScaler
from dataclasses import dataclass
from tqdm import tqdm
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class TrainingConfig:
    """训练配置"""
    # 模型
    model_name: str = "resnet50"
    num_classes: int = 1000

    # 训练
    epochs: int = 100
    batch_size: int = 32
    learning_rate: float = 1e-3
    weight_decay: float = 0.01

    # 学习率调度
    warmup_epochs: int = 5
    min_lr: float = 1e-6

    # 梯度
    gradient_accumulation_steps: int = 1
    max_grad_norm: float = 1.0

    # 混合精度
    use_amp: bool = True

    # 分布式
    distributed: bool = True

    # 检查点
    save_dir: str = "./checkpoints"
    save_every: int = 5

    # 早停
    patience: int = 10


class AdvancedTrainer:
    """
    高级训练器，包含所有技术：
    - 分布式数据并行 (DDP)
    - 混合精度 (AMP)
    - 梯度累积
    - 梯度裁剪
    - 带预热的学习率调度
    - 早停
    - 检查点保存
    """

    def __init__(self, model, train_dataset, val_dataset, config):
        self.config = config

        # 设置分布式训练
        if config.distributed:
            self.setup_distributed()
        else:
            self.rank = 0
            self.world_size = 1
            self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

        # 设置模型
        self.model = model.to(self.device)
        if config.distributed:
            self.model = DDP(self.model, device_ids=[self.rank])

        # 设置数据加载器
        self.train_loader, self.val_loader = self.setup_dataloaders(
            train_dataset, val_dataset
        )

        # 设置优化器
        self.optimizer = optim.AdamW(
            self.model.parameters(),
            lr=config.learning_rate,
            weight_decay=config.weight_decay
        )

        # 设置学习率调度器
        self.scheduler = self.setup_scheduler()

        # 设置损失函数
        self.criterion = nn.CrossEntropyLoss()

        # 设置 AMP
        self.scaler = GradScaler() if config.use_amp else None

        # 训练状态
        self.current_epoch = 0
        self.global_step = 0
        self.best_val_loss = float('inf')
        self.patience_counter = 0

    def setup_distributed(self):
        """初始化分布式训练"""
        self.rank = int(os.environ.get('LOCAL_RANK', 0))
        self.world_size = int(os.environ.get('WORLD_SIZE', 1))

        dist.init_process_group(backend='nccl')
        torch.cuda.set_device(self.rank)
        self.device = torch.device(f'cuda:{self.rank}')

        if self.rank == 0:
            logger.info(f"在 {self.world_size} 个 GPU 上进行分布式训练")

    def setup_dataloaders(self, train_dataset, val_dataset):
        """设置带分布式采样器的数据加载器"""
        if self.config.distributed:
            train_sampler = DistributedSampler(
                train_dataset,
                num_replicas=self.world_size,
                rank=self.rank,
                shuffle=True
            )
            val_sampler = DistributedSampler(
                val_dataset,
                num_replicas=self.world_size,
                rank=self.rank,
                shuffle=False
            )
        else:
            train_sampler = None
            val_sampler = None

        train_loader = DataLoader(
            train_dataset,
            batch_size=self.config.batch_size,
            sampler=train_sampler,
            shuffle=(train_sampler is None),
            num_workers=4,
            pin_memory=True
        )

        val_loader = DataLoader(
            val_dataset,
            batch_size=self.config.batch_size,
            sampler=val_sampler,
            shuffle=False,
            num_workers=4,
            pin_memory=True
        )

        return train_loader, val_loader

    def setup_scheduler(self):
        """设置带预热的学习率调度器"""
        num_training_steps = len(self.train_loader) * self.config.epochs
        num_warmup_steps = len(self.train_loader) * self.config.warmup_epochs

        def lr_lambda(step):
            if step < num_warmup_steps:
                # 线性预热
                return step / num_warmup_steps
            else:
                # 余弦退火
                progress = (step - num_warmup_steps) / (num_training_steps - num_warmup_steps)
                return self.config.min_lr / self.config.learning_rate + \
                       (1 - self.config.min_lr / self.config.learning_rate) * \
                       0.5 * (1 + math.cos(math.pi * progress))

        return optim.lr_scheduler.LambdaLR(self.optimizer, lr_lambda)

    def train_epoch(self):
        """训练一个 epoch"""
        self.model.train()

        if self.config.distributed:
            self.train_loader.sampler.set_epoch(self.current_epoch)

        total_loss = 0
        correct = 0
        total = 0

        self.optimizer.zero_grad()

        pbar = tqdm(
            self.train_loader,
            desc=f'Epoch {self.current_epoch + 1}',
            disable=(self.rank != 0)
        )

        for batch_idx, (data, target) in enumerate(pbar):
            data, target = data.to(self.device), target.to(self.device)

            # 使用 AMP 进行前向传播
            if self.config.use_amp:
                with autocast():
                    output = self.model(data)
                    loss = self.criterion(output, target)
                    loss = loss / self.config.gradient_accumulation_steps

                self.scaler.scale(loss).backward()
            else:
                output = self.model(data)
                loss = self.criterion(output, target)
                loss = loss / self.config.gradient_accumulation_steps
                loss.backward()

            # 梯度累积
            if (batch_idx + 1) % self.config.gradient_accumulation_steps == 0:
                # 梯度裁剪
                if self.config.use_amp:
                    self.scaler.unscale_(self.optimizer)

                torch.nn.utils.clip_grad_norm_(
                    self.model.parameters(),
                    self.config.max_grad_norm
                )

                # 优化器步骤
                if self.config.use_amp:
                    self.scaler.step(self.optimizer)
                    self.scaler.update()
                else:
                    self.optimizer.step()

                self.scheduler.step()
                self.optimizer.zero_grad()
                self.global_step += 1

            # 指标
            total_loss += loss.item() * self.config.gradient_accumulation_steps
            pred = output.argmax(dim=1)
            correct += pred.eq(target).sum().item()
            total += target.size(0)

        avg_loss = total_loss / len(self.train_loader)
        accuracy = correct / total

        return avg_loss, accuracy

    @torch.no_grad()
    def validate(self):
        """验证模型"""
        self.model.eval()

        total_loss = 0
        correct = 0
        total = 0

        for data, target in self.val_loader:
            data, target = data.to(self.device), target.to(self.device)

            if self.config.use_amp:
                with autocast():
                    output = self.model(data)
                    loss = self.criterion(output, target)
            else:
                output = self.model(data)
                loss = self.criterion(output, target)

            total_loss += loss.item()
            pred = output.argmax(dim=1)
            correct += pred.eq(target).sum().item()
            total += target.size(0)

        # 在 GPU 之间同步指标
        if self.config.distributed:
            metrics = torch.tensor([total_loss, correct, total], device=self.device)
            dist.all_reduce(metrics)
            total_loss, correct, total = metrics.tolist()

        avg_loss = total_loss / len(self.val_loader)
        accuracy = correct / total

        return avg_loss, accuracy

    def save_checkpoint(self, filename):
        """保存训练检查点"""
        if self.rank != 0:
            return

        os.makedirs(self.config.save_dir, exist_ok=True)

        checkpoint = {
            'epoch': self.current_epoch,
            'global_step': self.global_step,
            'model_state_dict': self.model.module.state_dict()
                               if self.config.distributed else self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'scheduler_state_dict': self.scheduler.state_dict(),
            'best_val_loss': self.best_val_loss,
        }

        if self.scaler:
            checkpoint['scaler_state_dict'] = self.scaler.state_dict()

        path = os.path.join(self.config.save_dir, filename)
        torch.save(checkpoint, path)
        logger.info(f"检查点已保存到 {path}")

    def train(self):
        """主训练循环"""
        logger.info("开始训练...")

        for epoch in range(self.current_epoch, self.config.epochs):
            self.current_epoch = epoch

            # 训练
            train_loss, train_acc = self.train_epoch()

            # 验证
            val_loss, val_acc = self.validate()

            # 日志记录
            if self.rank == 0:
                logger.info(
                    f"Epoch {epoch + 1}/{self.config.epochs} - "
                    f"训练损失: {train_loss:.4f}, 训练准确率: {train_acc*100:.2f}% - "
                    f"验证损失: {val_loss:.4f}, 验证准确率: {val_acc*100:.2f}%"
                )

            # 保存检查点
            if (epoch + 1) % self.config.save_every == 0:
                self.save_checkpoint(f'checkpoint_epoch_{epoch + 1}.pt')

            # 最佳模型
            if val_loss < self.best_val_loss:
                self.best_val_loss = val_loss
                self.save_checkpoint('best_model.pt')
                self.patience_counter = 0
            else:
                self.patience_counter += 1

            # 早停
            if self.patience_counter >= self.config.patience:
                if self.rank == 0:
                    logger.info(f"在 epoch {epoch + 1} 早停")
                break

        # 清理
        if self.config.distributed:
            dist.destroy_process_group()
```

---

## 最佳实践和常见陷阱

### 最佳实践

#### 学习率

```python
# 训练前使用学习率查找器
lrs, losses = lr_finder(model, train_loader, optimizer, criterion)
best_lr = lrs[losses.index(min(losses))] / 10  # 使用找到的最佳值的 1/10

# 根据批量大小缩放学习率
def scaled_lr(base_lr, base_batch, actual_batch):
    return base_lr * (actual_batch / base_batch)

# 对大批量或 transformer 使用预热
# 预热约总训练步数的 5-10%

# 优先使用 OneCycleLR 或余弦退火而不是 step decay
```

#### 梯度处理

```python
# 训练 RNN/Transformer 时始终裁剪梯度
torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)

# 监控梯度范数
total_norm = sum(p.grad.data.norm(2).item() ** 2 for p in model.parameters()) ** 0.5

# 在内存受限场景使用梯度累积
effective_batch_size = batch_size * accumulation_steps * world_size
```

#### 混合精度

```python
# 使用 AMP 时始终使用 GradScaler
scaler = GradScaler()

# 裁剪前取消梯度缩放
scaler.unscale_(optimizer)
torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)

# 某些操作需要 FP32（由 autocast 自动处理）
# - Softmax, log_softmax, cross_entropy
# - BatchNorm, LayerNorm
```

#### 分布式训练

```python
# 始终在 DistributedSampler 中设置 epoch
sampler.set_epoch(epoch)

# 只从 rank 0 保存和加载检查点
if rank == 0:
    torch.save(checkpoint, path)

# 对多 GPU 训练使用 SyncBatchNorm
model = nn.SyncBatchNorm.convert_sync_batchnorm(model)

# 在记录日志前同步指标
dist.all_reduce(loss_tensor)
```

### 常见陷阱

```python
# 错误：忘记为采样器设置 epoch
for epoch in range(epochs):
    for data in train_loader:  # 每个 epoch 将使用相同的顺序！
        pass

# 正确：
for epoch in range(epochs):
    sampler.set_epoch(epoch)  # 对于正确的 shuffle 至关重要
    for data in train_loader:
        pass

# 错误：梯度累积处理不当
for batch in dataloader:
    loss = criterion(model(batch), target)
    loss.backward()
    if step % accum_steps == 0:
        optimizer.step()
        # 缺少：optimizer.zero_grad()

# 正确：
for batch in dataloader:
    loss = criterion(model(batch), target) / accum_steps  # 缩放损失
    loss.backward()
    if step % accum_steps == 0:
        optimizer.step()
        optimizer.zero_grad()

# 错误：使用 OneCycleLR 时每个 epoch 调用 scheduler.step()
for epoch in range(epochs):
    train()
    scheduler.step()  # 错误！OneCycleLR 需要每步更新

# 正确：
for epoch in range(epochs):
    for batch in train_loader:
        train_step()
        scheduler.step()  # 每个 batch/step
```

---

## 面试问题

### 基础问题

**问题1：解释学习率预热的目的和机制。**

预热在训练初始阶段将学习率从小值逐渐增加到目标值。这很重要因为：

1. **防止早期发散**：初始化时的大梯度如果学习率太高可能导致模型发散
2. **允许批量统计稳定**：BatchNorm 统计在训练早期不可靠
3. **启用更大的批量大小**：线性缩放规则需要预热才能正常工作
4. **transformer 必需**：自注意力梯度初期可能不稳定

```python
# 线性预热实现
warmup_lr = base_lr * (current_step / warmup_steps)
```

**问题2：DataParallel 和 DistributedDataParallel 有什么区别？**

| 方面 | DataParallel | DistributedDataParallel |
|------|--------------|------------------------|
| 通信 | 通过 Python GIL 的 all-gather | NCCL all-reduce |
| 效率 | 较低（GIL 瓶颈）| 较高（重叠通信）|
| 内存 | 主 GPU 使用更多 | 均匀分布 |
| 多节点 | 不支持 | 完全支持 |
| 批次处理 | 自动分割 | 使用 DistributedSampler 手动分割 |

**问题3：混合精度训练如何在使用 FP16 的同时保持精度？**

混合精度通过以下方式保持精度：

1. **损失缩放**：将损失乘以缩放因子以防止 FP16 反向传播期间的下溢
2. **FP32 主权重**：保留 FP32 权重副本用于累积
3. **选择性精度**：某些操作（softmax、norms）保持在 FP32
4. **动态缩放**：GradScaler 自动调整缩放因子以避免上溢/下溢

**问题4：解释梯度累积及何时使用它。**

梯度累积通过以下方式模拟更大的批量大小：

1. 运行多次前向-反向传播
2. 累积梯度而不清零
3. 在 N 个累积步骤后执行优化器步骤

使用场景：
- GPU 内存不足以满足所需的批量大小
- 训练受益于大批量的 transformer
- 在单个 GPU 上模拟多 GPU 训练

### 高级问题

**问题5：设计一个用于在 8-GPU 节点集群上训练 100 亿参数模型的训练系统。**

关键考虑：

1. **并行策略**：
   - 数据并行：复制模型，分割数据
   - 模型/张量并行：将层分割到 GPU 上
   - 流水线并行：将模型分成阶段

2. **内存优化**：
   - 混合精度（BF16/FP16）
   - 梯度检查点
   - ZeRO 优化器状态分区

3. **通信效率**：
   - 重叠计算和通信
   - 如果带宽有限则进行梯度压缩

**问题6：为什么即使使用梯度裁剪训练也可能发散？**

可能的原因：

1. **裁剪阈值太高**：无法防止爆炸
2. **裁剪阈值太低**：阻止学习，导致不稳定
3. **损失缩放问题**：在 AMP 中，缩放可能不正确
4. **NaN 传播**：前向传播中的 NaN 绕过裁剪
5. **学习率太高**：如果更新本身不稳定，裁剪无济于事

**问题7：比较 GPipe 和 PipeDream 调度策略。**

| 方面 | GPipe | PipeDream (1F1B) |
|------|-------|------------------|
| 内存 | 高（存储所有激活值）| 较低（早期释放）|
| 气泡比例 | 较高 | 较低 |
| 实现 | 更简单 | 更复杂 |
| 权重更新 | 同步 | 可以异步 |
| 梯度陈旧 | 无 | 异步时可能有 |

---

## 总结

本指南涵盖了核心深度学习训练技术：

1. **学习率调度**：Step decay、余弦退火、预热策略和 OneCycleLR
2. **混合精度训练**：使用 autocast 和 GradScaler 的 AMP 以加速训练
3. **梯度累积**：使用有限内存模拟更大的批量大小
4. **梯度裁剪**：防止 RNN 和 transformer 中的梯度爆炸
5. **分布式数据并行**：使用 NCCL 的高效多 GPU 训练
6. **模型并行**：将大模型分割到多个 GPU
7. **流水线并行**：高效的顺序模型分区

关键要点：
- 从基线开始，然后逐步添加技术
- 监控训练指标（损失、梯度、学习率）
- 分布式训练使用 DDP 而不是 DataParallel
- 在现代 GPU 上默认启用 AMP
- 根据有效批量大小缩放学习率
- 对 transformer/RNN 始终使用梯度裁剪

---

## 延伸阅读

### 论文

- "Accurate, Large Minibatch SGD: Training ImageNet in 1 Hour" - 线性缩放规则
- "Mixed Precision Training" - NVIDIA 混合精度方法论
- "GPipe: Efficient Training of Giant Neural Networks" - 流水线并行
- "Megatron-LM: Training Multi-Billion Parameter Language Models" - 模型并行
- "ZeRO: Memory Optimizations Toward Training Trillion Parameter Models" - 内存优化

### 文档

- [PyTorch 分布式训练](https://pytorch.org/tutorials/intermediate/ddp_tutorial.html)
- [PyTorch AMP](https://pytorch.org/docs/stable/amp.html)
- [NVIDIA 混合精度训练](https://developer.nvidia.com/automatic-mixed-precision)

### 框架

- DeepSpeed：微软分布式训练库
- FairScale：Facebook 训练工具
- PyTorch Lightning：高级训练框架
- Hugging Face Accelerate：简单分布式训练
