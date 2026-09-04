---
title: "Deep Learning Advanced: Training Techniques"
description: "Master DL training techniques: learning rate scheduling, mixed precision, and distributed training"
track: ai
section: deep-learning
difficulty: advanced
tags:
  - training
  - learning rate
  - mixed precision
  - distributed
status: imported
origin: old/src/content/docs/datascience/training-techniques.en.md
divergence: 0.211
issues: []
legacy:
  category: DataScience
  subcategory: DeepLearning
  order: 18
  lastUpdated: 2026-01-07
---

Training deep neural networks effectively requires mastering a variety of techniques that go beyond basic gradient descent. This comprehensive guide covers advanced training strategies that are essential for achieving state-of-the-art performance, reducing training time, and scaling to large models and datasets.

---

## Learning Rate Scheduling

The learning rate is arguably the most important hyperparameter in deep learning. A well-designed learning rate schedule can significantly improve convergence speed and final model performance.

### Why Learning Rate Scheduling Matters

- **Too high**: Training may diverge or oscillate around the minimum
- **Too low**: Training is slow and may get stuck in local minima
- **Dynamic scheduling**: Allows aggressive early exploration and fine-grained later optimization

### Step Decay Scheduler

Step decay reduces the learning rate by a factor at fixed intervals.

```python
import torch
import torch.optim as optim
import matplotlib.pyplot as plt

# Create a simple model and optimizer
model = torch.nn.Linear(10, 1)
optimizer = optim.SGD(model.parameters(), lr=0.1)

# StepLR: Reduce LR by gamma every step_size epochs
scheduler = optim.lr_scheduler.StepLR(
    optimizer,
    step_size=30,  # Decay every 30 epochs
    gamma=0.1      # Multiply LR by 0.1
)

# Track learning rates
lrs = []
for epoch in range(100):
    lrs.append(optimizer.param_groups[0]['lr'])
    # Training step would go here
    optimizer.step()
    scheduler.step()

# Visualization
plt.figure(figsize=(10, 4))
plt.plot(lrs)
plt.xlabel('Epoch')
plt.ylabel('Learning Rate')
plt.title('Step Decay Learning Rate Schedule')
plt.grid(True)
plt.savefig('step_decay_lr.png')
```

### MultiStep Decay

For more control, specify exact epochs where decay occurs:

```python
# MultiStepLR: Decay at specific milestones
scheduler = optim.lr_scheduler.MultiStepLR(
    optimizer,
    milestones=[30, 60, 80],  # Decay at epochs 30, 60, and 80
    gamma=0.1
)

# Common pattern for ImageNet training
scheduler = optim.lr_scheduler.MultiStepLR(
    optimizer,
    milestones=[30, 60, 90],
    gamma=0.1
)
```

### Cosine Annealing Scheduler

Cosine annealing provides smooth learning rate decay following a cosine curve, which often leads to better convergence.

**Mathematical formulation:**

$$\eta_t = \eta_{min} + \frac{1}{2}(\eta_{max} - \eta_{min})\left(1 + \cos\left(\frac{T_{cur}}{T_{max}}\pi\right)\right)$$

```python
# CosineAnnealingLR
scheduler = optim.lr_scheduler.CosineAnnealingLR(
    optimizer,
    T_max=100,      # Total number of epochs
    eta_min=1e-6    # Minimum learning rate
)

# Track and visualize
lrs = []
for epoch in range(100):
    lrs.append(optimizer.param_groups[0]['lr'])
    optimizer.step()
    scheduler.step()

plt.figure(figsize=(10, 4))
plt.plot(lrs)
plt.xlabel('Epoch')
plt.ylabel('Learning Rate')
plt.title('Cosine Annealing Learning Rate Schedule')
plt.grid(True)
```

### Cosine Annealing with Warm Restarts

Periodically reset the learning rate to escape local minima:

```python
# CosineAnnealingWarmRestarts
scheduler = optim.lr_scheduler.CosineAnnealingWarmRestarts(
    optimizer,
    T_0=10,      # Number of epochs for the first restart
    T_mult=2,    # Factor to increase T_i after each restart
    eta_min=1e-6
)

# Example schedule for 100 epochs with T_0=10, T_mult=2:
# Restarts at: 10, 30, 70, ...
```

### Warmup Strategies

Warmup gradually increases the learning rate from a small value to the target value during the initial training phase. This is crucial for:

- Stabilizing training with large batch sizes
- Preventing early divergence
- Improving final performance in transformer models

```python
import math

class WarmupScheduler:
    """Linear warmup scheduler"""
    def __init__(self, optimizer, warmup_epochs, target_lr):
        self.optimizer = optimizer
        self.warmup_epochs = warmup_epochs
        self.target_lr = target_lr
        self.current_epoch = 0

        # Start with very small LR
        for param_group in optimizer.param_groups:
            param_group['lr'] = target_lr / warmup_epochs

    def step(self):
        self.current_epoch += 1
        if self.current_epoch <= self.warmup_epochs:
            lr = self.target_lr * self.current_epoch / self.warmup_epochs
            for param_group in self.optimizer.param_groups:
                param_group['lr'] = lr


class WarmupCosineScheduler:
    """Warmup followed by cosine annealing - common in transformer training"""
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
            # Linear warmup
            lr = self.warmup_start_lr + (self.base_lr - self.warmup_start_lr) * \
                 (self.current_epoch / self.warmup_epochs)
        else:
            # Cosine annealing
            progress = (self.current_epoch - self.warmup_epochs) / \
                      (self.total_epochs - self.warmup_epochs)
            lr = self.min_lr + (self.base_lr - self.min_lr) * \
                 0.5 * (1 + math.cos(math.pi * progress))

        for param_group in self.optimizer.param_groups:
            param_group['lr'] = lr

        return lr


# Using PyTorch built-in LinearLR for warmup combined with other schedulers
from torch.optim.lr_scheduler import LinearLR, CosineAnnealingLR, SequentialLR

optimizer = optim.AdamW(model.parameters(), lr=1e-3)

# Warmup for 5 epochs, then cosine annealing for 95 epochs
warmup_scheduler = LinearLR(
    optimizer,
    start_factor=0.01,  # Start at 1% of base LR
    end_factor=1.0,     # End at 100% of base LR
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

One of the most effective schedulers, combining warmup and annealing in a single cycle:

```python
# OneCycleLR - Highly recommended for many tasks
scheduler = optim.lr_scheduler.OneCycleLR(
    optimizer,
    max_lr=0.01,              # Peak learning rate
    epochs=100,
    steps_per_epoch=len(train_loader),
    pct_start=0.3,            # Percentage of cycle spent increasing LR
    anneal_strategy='cos',    # 'cos' or 'linear'
    div_factor=25,            # initial_lr = max_lr / div_factor
    final_div_factor=1e4      # final_lr = initial_lr / final_div_factor
)

# Important: Call scheduler.step() after each batch, not epoch
for epoch in range(epochs):
    for batch in train_loader:
        # Training step
        loss = train_step(batch)
        optimizer.step()
        scheduler.step()  # Step per batch!
```

### Learning Rate Finder

Find the optimal learning rate range before training:

```python
def lr_finder(model, train_loader, optimizer, criterion,
              start_lr=1e-7, end_lr=10, num_iter=100):
    """
    Learning rate range test to find optimal LR.
    Based on: https://arxiv.org/abs/1506.01186
    """
    model.train()

    # Save initial state
    initial_state = {
        'model': model.state_dict(),
        'optimizer': optimizer.state_dict()
    }

    # Calculate LR multiplication factor
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

        # Stop if loss explodes
        if loss.item() > 4 * best_loss or torch.isnan(loss):
            break

        if loss.item() < best_loss:
            best_loss = loss.item()

        losses.append(loss.item())
        lrs.append(lr)

        loss.backward()
        optimizer.step()

        # Update LR
        lr *= lr_mult
        optimizer.param_groups[0]['lr'] = lr

    # Restore initial state
    model.load_state_dict(initial_state['model'])
    optimizer.load_state_dict(initial_state['optimizer'])

    # Plot results
    plt.figure(figsize=(10, 4))
    plt.semilogx(lrs, losses)
    plt.xlabel('Learning Rate')
    plt.ylabel('Loss')
    plt.title('Learning Rate Finder')
    plt.grid(True)
    plt.savefig('lr_finder.png')

    return lrs, losses
```

---

## Mixed Precision Training

Mixed precision training uses lower-precision floating-point formats (FP16) for most operations while maintaining FP32 precision where necessary. This approach can:

- **Reduce memory usage** by up to 50%
- **Speed up training** by 2-3x on modern GPUs
- **Enable larger batch sizes**
- **Maintain model accuracy**

### Understanding Precision Formats

| Format | Bits | Range | Precision |
|--------|------|-------|-----------|
| FP32 (float) | 32 | ~1e-38 to 1e38 | ~7 decimal digits |
| FP16 (half) | 16 | ~6e-5 to 65504 | ~3 decimal digits |
| BF16 (bfloat16) | 16 | ~1e-38 to 1e38 | ~3 decimal digits |

### Automatic Mixed Precision (AMP) with PyTorch

PyTorch provides `torch.cuda.amp` for easy mixed precision training:

```python
import torch
from torch.cuda.amp import autocast, GradScaler

def train_with_amp(model, train_loader, optimizer, criterion,
                   device='cuda', accumulation_steps=1):
    """
    Training loop with Automatic Mixed Precision.
    """
    model.train()
    scaler = GradScaler()

    total_loss = 0
    optimizer.zero_grad()

    for batch_idx, (data, target) in enumerate(train_loader):
        data, target = data.to(device), target.to(device)

        # Forward pass with autocast
        with autocast():
            output = model(data)
            loss = criterion(output, target)
            loss = loss / accumulation_steps  # Scale for gradient accumulation

        # Backward pass with scaled gradients
        scaler.scale(loss).backward()

        # Update weights every accumulation_steps
        if (batch_idx + 1) % accumulation_steps == 0:
            # Unscale gradients for clipping
            scaler.unscale_(optimizer)

            # Gradient clipping
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)

            # Optimizer step with scaler
            scaler.step(optimizer)
            scaler.update()

            optimizer.zero_grad()

        total_loss += loss.item() * accumulation_steps

    return total_loss / len(train_loader)
```

### Complete AMP Trainer Class

```python
class AMPTrainer:
    """Complete trainer class with AMP support"""

    def __init__(self, model, train_loader, val_loader, criterion,
                 optimizer, scheduler=None, device='cuda'):
        self.model = model.to(device)
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.criterion = criterion
        self.optimizer = optimizer
        self.scheduler = scheduler
        self.device = device

        # Initialize GradScaler for AMP
        self.scaler = GradScaler()

        # Metrics tracking
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

            # Mixed precision forward pass
            with autocast():
                output = self.model(data)
                loss = self.criterion(output, target)

            # Scaled backward pass
            self.scaler.scale(loss).backward()

            # Unscale before gradient clipping
            self.scaler.unscale_(self.optimizer)
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)

            # Optimizer step
            self.scaler.step(self.optimizer)
            self.scaler.update()

            # Metrics
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

            # Use autocast for validation too
            with autocast():
                output = self.model(data)
                loss = self.criterion(output, target)

            total_loss += loss.item()
            pred = output.argmax(dim=1)
            correct += pred.eq(target).sum().item()
            total += target.size(0)

        return total_loss / len(self.val_loader), correct / total
```

### BFloat16 Training

BFloat16 has the same dynamic range as FP32 but with reduced precision. It is particularly useful for training and supported on newer GPUs (Ampere+):

```python
# BFloat16 training (requires Ampere or newer GPU)
with autocast(dtype=torch.bfloat16):
    output = model(data)
    loss = criterion(output, target)

# Note: BFloat16 often does not require GradScaler due to larger dynamic range
# However, it is still recommended for stability
```

### AMP Best Practices

```python
# Operations that are safe in FP16
safe_fp16_ops = [
    'torch.nn.Linear',
    'torch.nn.Conv2d',
    'torch.nn.Conv1d',
    'torch.matmul',
    'torch.bmm',
]

# Operations that should remain in FP32
keep_fp32_ops = [
    'torch.nn.LayerNorm',
    'torch.nn.BatchNorm2d',
    'torch.nn.Softmax',
    'torch.nn.CrossEntropyLoss',
    'torch.log',
    'torch.exp',
    'torch.pow',
]

# Custom autocast context for specific operations
@torch.cuda.amp.custom_fwd(cast_inputs=torch.float32)
def stable_softmax(x):
    """Force FP32 for numerical stability"""
    return torch.nn.functional.softmax(x, dim=-1)
```

---

## Gradient Accumulation

Gradient accumulation allows training with effectively larger batch sizes than GPU memory permits by accumulating gradients over multiple forward-backward passes before updating weights.

### Why Use Gradient Accumulation?

- **Memory constraints**: Train with large effective batch sizes on limited GPU memory
- **Batch size sensitivity**: Some models (especially transformers) benefit from large batch sizes
- **Multi-GPU simulation**: Simulate multi-GPU training on a single GPU

### Implementation

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
    Train with gradient accumulation.

    Effective batch size = actual_batch_size * accumulation_steps

    Example: batch_size=16, accumulation_steps=4 -> effective_batch_size=64
    """
    model.train()
    optimizer.zero_grad()

    total_loss = 0
    accumulated_loss = 0

    for batch_idx, (data, target) in enumerate(train_loader):
        data, target = data.to(device), target.to(device)

        # Forward pass
        output = model(data)
        loss = criterion(output, target)

        # Normalize loss by accumulation steps
        # This ensures gradients are properly scaled
        loss = loss / accumulation_steps

        # Backward pass (accumulate gradients)
        loss.backward()

        accumulated_loss += loss.item()

        # Update weights every accumulation_steps batches
        if (batch_idx + 1) % accumulation_steps == 0:
            # Optional: Gradient clipping
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)

            # Update parameters
            optimizer.step()
            optimizer.zero_grad()

            total_loss += accumulated_loss
            accumulated_loss = 0

    # Handle remaining batches if dataset size is not divisible by accumulation_steps
    if (batch_idx + 1) % accumulation_steps != 0:
        optimizer.step()
        optimizer.zero_grad()
        total_loss += accumulated_loss

    return total_loss / (len(train_loader) // accumulation_steps)
```

### Learning Rate Scaling with Gradient Accumulation

When using gradient accumulation, you may need to adjust the learning rate:

```python
def get_scaled_lr(base_lr, base_batch_size, effective_batch_size):
    """
    Linear scaling rule for learning rate.

    Reference: "Accurate, Large Minibatch SGD: Training ImageNet in 1 Hour"
    """
    return base_lr * (effective_batch_size / base_batch_size)

# Example usage
base_lr = 0.001
base_batch_size = 32
actual_batch_size = 8
accumulation_steps = 16

effective_batch_size = actual_batch_size * accumulation_steps  # 128
scaled_lr = get_scaled_lr(base_lr, base_batch_size, effective_batch_size)
print(f"Scaled LR: {scaled_lr}")  # 0.004
```

---

## Gradient Clipping

Gradient clipping prevents exploding gradients by capping gradient values during training. This is essential for training RNNs, LSTMs, and transformer models.

### Types of Gradient Clipping

#### Gradient Norm Clipping

Scales gradients if their total norm exceeds a threshold:

```python
import torch

def clip_gradient_norm(model, max_norm, norm_type=2):
    """
    Clip gradients by their total norm.

    If ||g|| > max_norm, scale: g = g * (max_norm / ||g||)
    """
    total_norm = torch.nn.utils.clip_grad_norm_(
        model.parameters(),
        max_norm=max_norm,
        norm_type=norm_type  # L2 norm by default
    )
    return total_norm

# Usage in training loop
optimizer.zero_grad()
loss.backward()

# Clip gradients before optimizer step
total_norm = clip_gradient_norm(model, max_norm=1.0)
print(f"Gradient norm: {total_norm:.4f}")

optimizer.step()
```

#### Gradient Value Clipping

Clips each gradient element to a maximum absolute value:

```python
def clip_gradient_value(model, clip_value):
    """
    Clip each gradient element to [-clip_value, clip_value].
    """
    torch.nn.utils.clip_grad_value_(
        model.parameters(),
        clip_value=clip_value
    )

# Usage
optimizer.zero_grad()
loss.backward()
clip_gradient_value(model, clip_value=0.5)
optimizer.step()
```

### Adaptive Gradient Clipping (AGC)

AGC clips based on the ratio of gradient norm to parameter norm:

```python
def adaptive_gradient_clipping(model, clip_factor=0.01, eps=1e-3):
    """
    Adaptive Gradient Clipping from NFNet paper.

    Clips gradients based on parameter-wise unit norm.
    Reference: "High-Performance Large-Scale Image Recognition Without Normalization"
    """
    for param in model.parameters():
        if param.grad is None:
            continue

        # Compute parameter norm (per-unit for conv/linear layers)
        param_norm = param.data.norm(dim=tuple(range(1, param.dim())), keepdim=True)
        grad_norm = param.grad.norm(dim=tuple(range(1, param.grad.dim())), keepdim=True)

        # Compute max allowed gradient norm
        max_norm = param_norm * clip_factor

        # Clip if gradient norm exceeds max
        trigger = grad_norm > max_norm
        clipped_grad = param.grad * (max_norm / (grad_norm + eps))
        param.grad.data.copy_(torch.where(trigger, clipped_grad, param.grad))
```

### Gradient Monitoring

```python
class GradientMonitor:
    """Monitor gradient statistics during training"""

    def __init__(self, model):
        self.model = model
        self.grad_history = {name: [] for name, _ in model.named_parameters()}

    def record_gradients(self):
        """Record gradient norms for all parameters"""
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
        """Check for vanishing or exploding gradients"""
        issues = []

        for name, param in self.model.named_parameters():
            if param.grad is not None:
                grad_norm = param.grad.data.norm().item()

                if grad_norm < 1e-7:
                    issues.append(f"Vanishing gradient in {name}: {grad_norm:.2e}")
                elif grad_norm > 1e3:
                    issues.append(f"Exploding gradient in {name}: {grad_norm:.2e}")
                elif torch.isnan(param.grad).any():
                    issues.append(f"NaN gradient in {name}")

        return issues
```

---

## Distributed Data Parallel (DDP)

DDP is the recommended approach for distributed training in PyTorch. It synchronizes gradients across multiple GPUs/nodes efficiently using all-reduce operations.

### DDP Architecture

- Each process runs an independent copy of the model
- After each backward pass, gradients are synchronized (averaged)
- All processes update their models identically

### Single-Node Multi-GPU Training

```python
import os
import torch
import torch.nn as nn
import torch.distributed as dist
import torch.multiprocessing as mp
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.utils.data import DataLoader, DistributedSampler

def setup(rank, world_size):
    """Initialize the distributed environment"""
    os.environ['MASTER_ADDR'] = 'localhost'
    os.environ['MASTER_PORT'] = '12355'

    # Initialize process group
    dist.init_process_group(
        backend='nccl',  # Use NCCL backend for GPU training
        init_method='env://',
        world_size=world_size,
        rank=rank
    )

    # Set device for this process
    torch.cuda.set_device(rank)

def cleanup():
    """Clean up distributed environment"""
    dist.destroy_process_group()

def train_ddp(rank, world_size, dataset, model_class, epochs):
    """
    Training function for each process in DDP.

    Args:
        rank: Unique identifier for this process
        world_size: Total number of processes
        dataset: Training dataset
        model_class: Model class to instantiate
        epochs: Number of training epochs
    """
    # Setup distributed environment
    setup(rank, world_size)

    # Create model and move to GPU
    model = model_class().to(rank)

    # Wrap model with DDP
    ddp_model = DDP(model, device_ids=[rank])

    # Create distributed sampler
    sampler = DistributedSampler(
        dataset,
        num_replicas=world_size,
        rank=rank,
        shuffle=True
    )

    # Create dataloader with distributed sampler
    dataloader = DataLoader(
        dataset,
        batch_size=32,
        sampler=sampler,
        num_workers=4,
        pin_memory=True
    )

    # Loss and optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(ddp_model.parameters(), lr=1e-3)

    # Training loop
    for epoch in range(epochs):
        # IMPORTANT: Set epoch for sampler to ensure proper shuffling
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

        # Only print from rank 0
        if rank == 0:
            avg_loss = total_loss / len(dataloader)
            print(f'Epoch {epoch+1}/{epochs}, Loss: {avg_loss:.4f}')

    # Save model (only from rank 0)
    if rank == 0:
        torch.save(ddp_model.module.state_dict(), 'model_ddp.pt')

    cleanup()

def main():
    """Launch distributed training"""
    world_size = torch.cuda.device_count()
    print(f"Training on {world_size} GPUs")

    # Spawn processes
    mp.spawn(
        train_ddp,
        args=(world_size, dataset, ModelClass, 10),
        nprocs=world_size,
        join=True
    )

if __name__ == '__main__':
    main()
```

### Multi-Node Training

```python
import os
import torch
import torch.distributed as dist

def setup_multi_node():
    """
    Setup for multi-node training.

    Environment variables required:
    - MASTER_ADDR: IP address of master node
    - MASTER_PORT: Port on master node
    - WORLD_SIZE: Total number of processes
    - RANK: Global rank of this process
    - LOCAL_RANK: Local rank on this node
    """
    # Get environment variables
    rank = int(os.environ['RANK'])
    world_size = int(os.environ['WORLD_SIZE'])
    local_rank = int(os.environ['LOCAL_RANK'])

    # Initialize process group
    dist.init_process_group(
        backend='nccl',
        init_method='env://',
        world_size=world_size,
        rank=rank
    )

    # Set device
    torch.cuda.set_device(local_rank)

    return rank, world_size, local_rank


# Launch command for multi-node training:
# Node 0: torchrun --nproc_per_node=4 --nnodes=2 --node_rank=0 \
#                  --master_addr="192.168.1.1" --master_port=12355 train.py
# Node 1: torchrun --nproc_per_node=4 --nnodes=2 --node_rank=1 \
#                  --master_addr="192.168.1.1" --master_port=12355 train.py
```

### DDP with AMP

```python
from torch.cuda.amp import autocast, GradScaler

def train_ddp_amp(rank, world_size, dataset, model_class, epochs):
    """DDP training with Automatic Mixed Precision"""
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

### Useful DDP Utilities

```python
def reduce_tensor(tensor, world_size):
    """Average tensor across all processes"""
    rt = tensor.clone()
    dist.all_reduce(rt, op=dist.ReduceOp.SUM)
    rt /= world_size
    return rt

def gather_tensors(tensor, world_size, rank):
    """Gather tensors from all processes"""
    gathered = [torch.zeros_like(tensor) for _ in range(world_size)]
    dist.all_gather(gathered, tensor)
    return gathered

def broadcast_tensor(tensor, src=0):
    """Broadcast tensor from source to all processes"""
    dist.broadcast(tensor, src=src)
    return tensor

class SyncBatchNorm:
    """Convert BatchNorm to SyncBatchNorm for DDP"""

    @staticmethod
    def convert(model):
        """Convert all BatchNorm layers to SyncBatchNorm"""
        return nn.SyncBatchNorm.convert_sync_batchnorm(model)
```

---

## Model Parallelism

Model parallelism splits the model across multiple GPUs, enabling training of models that do not fit in a single GPU memory.

### Types of Model Parallelism

1. **Tensor Parallelism**: Split individual layers across GPUs
2. **Pipeline Parallelism**: Split model into stages across GPUs
3. **Sequence Parallelism**: Split sequence dimension across GPUs

### Basic Model Parallelism

```python
import torch
import torch.nn as nn

class ModelParallelNetwork(nn.Module):
    """
    Simple model parallelism: split model between two GPUs.
    """

    def __init__(self, num_classes=1000):
        super().__init__()

        # First half on GPU 0
        self.seq1 = nn.Sequential(
            nn.Linear(1024, 2048),
            nn.ReLU(),
            nn.Linear(2048, 2048),
            nn.ReLU(),
        ).to('cuda:0')

        # Second half on GPU 1
        self.seq2 = nn.Sequential(
            nn.Linear(2048, 2048),
            nn.ReLU(),
            nn.Linear(2048, num_classes),
        ).to('cuda:1')

    def forward(self, x):
        # Forward through first half on GPU 0
        x = self.seq1(x.to('cuda:0'))

        # Transfer to GPU 1 and forward through second half
        x = self.seq2(x.to('cuda:1'))

        return x


# Training with model parallelism
model = ModelParallelNetwork()
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.SGD(model.parameters(), lr=0.01)

for data, target in dataloader:
    # Data starts on CPU
    data = data.to('cuda:0')  # Input goes to first GPU
    target = target.to('cuda:1')  # Labels go to last GPU (where output is)

    optimizer.zero_grad()
    output = model(data)
    loss = criterion(output, target)
    loss.backward()
    optimizer.step()
```

### Tensor Parallelism

Split individual layers (particularly large linear layers) across GPUs:

```python
class ColumnParallelLinear(nn.Module):
    """
    Linear layer with column parallelism.

    Splits the weight matrix along columns (output dimension).
    Each GPU computes a portion of the output.
    """

    def __init__(self, in_features, out_features, world_size, rank):
        super().__init__()
        self.world_size = world_size
        self.rank = rank

        # Each GPU handles out_features // world_size columns
        self.out_features_per_gpu = out_features // world_size
        self.linear = nn.Linear(in_features, self.out_features_per_gpu)

    def forward(self, x):
        # Each GPU computes its portion
        local_output = self.linear(x)

        # Gather outputs from all GPUs
        output_list = [torch.zeros_like(local_output) for _ in range(self.world_size)]
        dist.all_gather(output_list, local_output)

        # Concatenate along output dimension
        return torch.cat(output_list, dim=-1)


class RowParallelLinear(nn.Module):
    """
    Linear layer with row parallelism.

    Splits the weight matrix along rows (input dimension).
    Input must be split across GPUs.
    """

    def __init__(self, in_features, out_features, world_size, rank):
        super().__init__()
        self.world_size = world_size
        self.rank = rank

        # Each GPU handles in_features // world_size rows
        self.in_features_per_gpu = in_features // world_size
        self.linear = nn.Linear(self.in_features_per_gpu, out_features, bias=(rank == 0))

    def forward(self, x):
        # x is already split: each GPU has in_features_per_gpu features
        local_output = self.linear(x)

        # Sum outputs across GPUs
        dist.all_reduce(local_output, op=dist.ReduceOp.SUM)

        return local_output
```

---

## Pipeline Parallelism

Pipeline parallelism divides the model into stages and processes micro-batches in a pipelined fashion to improve GPU utilization.

### Concept

```
Time ->
GPU 0: [F1] [F2] [F3] [F4] [B4] [B3] [B2] [B1]
GPU 1:      [F1] [F2] [F3] [B3] [B2] [B1] [B4]
GPU 2:           [F1] [F2] [B2] [B1] [B4] [B3]
GPU 3:                [F1] [B1] [B4] [B3] [B2]

F = Forward, B = Backward, numbers = micro-batch index
```

### Implementation with PyTorch

```python
from torch.distributed.pipeline.sync import Pipe

class PipelineModel(nn.Module):
    """Model designed for pipeline parallelism"""

    def __init__(self):
        super().__init__()

        # Define stages
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
    Setup pipeline parallelism with Pipe.

    Args:
        model: Model to parallelize
        chunks: Number of micro-batches (higher = better GPU utilization)
    """
    # Move stages to different GPUs
    model.stage1.to('cuda:0')
    model.stage2.to('cuda:1')
    model.stage3.to('cuda:2')
    model.stage4.to('cuda:3')

    # Wrap with Pipe
    model = Pipe(
        nn.Sequential(
            model.stage1,
            model.stage2,
            model.stage3,
            model.stage4,
        ),
        chunks=chunks,
        checkpoint='never'  # or 'always' for memory efficiency
    )

    return model
```

### GPipe-style Implementation

```python
class GPipeSchedule:
    """
    GPipe-style pipeline schedule.

    Splits mini-batch into micro-batches and processes them in a pipeline.
    """

    def __init__(self, stages, num_microbatches):
        self.stages = stages  # List of nn.Module on different GPUs
        self.num_stages = len(stages)
        self.num_microbatches = num_microbatches

    def forward_backward(self, batch, labels, criterion):
        """
        Execute forward and backward passes with pipeline schedule.
        """
        batch_size = batch.size(0)
        microbatch_size = batch_size // self.num_microbatches

        # Split into micro-batches
        microbatches = batch.split(microbatch_size)
        labels_split = labels.split(microbatch_size)

        # Storage for activations
        activations = [{} for _ in range(self.num_stages)]

        total_loss = 0

        # Forward pass - fill the pipeline
        for mb_idx, (mb, mb_labels) in enumerate(zip(microbatches, labels_split)):
            x = mb
            for stage_idx, stage in enumerate(self.stages):
                device = next(stage.parameters()).device
                x = x.to(device)
                x = stage(x)
                activations[stage_idx][mb_idx] = x

            # Compute loss for this micro-batch
            loss = criterion(x, mb_labels.to(x.device))
            total_loss += loss

        # Backward pass
        total_loss.backward()

        return total_loss.item() / self.num_microbatches
```

---

## Complete Training Pipeline

The following is a complete, production-ready training pipeline combining all techniques:

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
    """Training configuration"""
    # Model
    model_name: str = "resnet50"
    num_classes: int = 1000

    # Training
    epochs: int = 100
    batch_size: int = 32
    learning_rate: float = 1e-3
    weight_decay: float = 0.01

    # Learning rate schedule
    warmup_epochs: int = 5
    min_lr: float = 1e-6

    # Gradient
    gradient_accumulation_steps: int = 1
    max_grad_norm: float = 1.0

    # Mixed precision
    use_amp: bool = True

    # Distributed
    distributed: bool = True

    # Checkpointing
    save_dir: str = "./checkpoints"
    save_every: int = 5

    # Early stopping
    patience: int = 10


class AdvancedTrainer:
    """
    Advanced trainer with all techniques:
    - Distributed Data Parallel (DDP)
    - Mixed Precision (AMP)
    - Gradient Accumulation
    - Gradient Clipping
    - Learning Rate Scheduling with Warmup
    - Early Stopping
    - Checkpointing
    """

    def __init__(self, model, train_dataset, val_dataset, config):
        self.config = config

        # Setup distributed training
        if config.distributed:
            self.setup_distributed()
        else:
            self.rank = 0
            self.world_size = 1
            self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

        # Setup model
        self.model = model.to(self.device)
        if config.distributed:
            self.model = DDP(self.model, device_ids=[self.rank])

        # Setup data loaders
        self.train_loader, self.val_loader = self.setup_dataloaders(
            train_dataset, val_dataset
        )

        # Setup optimizer
        self.optimizer = optim.AdamW(
            self.model.parameters(),
            lr=config.learning_rate,
            weight_decay=config.weight_decay
        )

        # Setup learning rate scheduler
        self.scheduler = self.setup_scheduler()

        # Setup loss function
        self.criterion = nn.CrossEntropyLoss()

        # Setup AMP
        self.scaler = GradScaler() if config.use_amp else None

        # Training state
        self.current_epoch = 0
        self.global_step = 0
        self.best_val_loss = float('inf')
        self.patience_counter = 0

    def setup_distributed(self):
        """Initialize distributed training"""
        self.rank = int(os.environ.get('LOCAL_RANK', 0))
        self.world_size = int(os.environ.get('WORLD_SIZE', 1))

        dist.init_process_group(backend='nccl')
        torch.cuda.set_device(self.rank)
        self.device = torch.device(f'cuda:{self.rank}')

        if self.rank == 0:
            logger.info(f"Distributed training on {self.world_size} GPUs")

    def setup_dataloaders(self, train_dataset, val_dataset):
        """Setup data loaders with distributed sampler"""
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
        """Setup learning rate scheduler with warmup"""
        num_training_steps = len(self.train_loader) * self.config.epochs
        num_warmup_steps = len(self.train_loader) * self.config.warmup_epochs

        def lr_lambda(step):
            if step < num_warmup_steps:
                # Linear warmup
                return step / num_warmup_steps
            else:
                # Cosine annealing
                progress = (step - num_warmup_steps) / (num_training_steps - num_warmup_steps)
                return self.config.min_lr / self.config.learning_rate + \
                       (1 - self.config.min_lr / self.config.learning_rate) * \
                       0.5 * (1 + math.cos(math.pi * progress))

        return optim.lr_scheduler.LambdaLR(self.optimizer, lr_lambda)

    def train_epoch(self):
        """Train for one epoch"""
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

            # Forward pass with AMP
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

            # Gradient accumulation
            if (batch_idx + 1) % self.config.gradient_accumulation_steps == 0:
                # Gradient clipping
                if self.config.use_amp:
                    self.scaler.unscale_(self.optimizer)

                torch.nn.utils.clip_grad_norm_(
                    self.model.parameters(),
                    self.config.max_grad_norm
                )

                # Optimizer step
                if self.config.use_amp:
                    self.scaler.step(self.optimizer)
                    self.scaler.update()
                else:
                    self.optimizer.step()

                self.scheduler.step()
                self.optimizer.zero_grad()
                self.global_step += 1

            # Metrics
            total_loss += loss.item() * self.config.gradient_accumulation_steps
            pred = output.argmax(dim=1)
            correct += pred.eq(target).sum().item()
            total += target.size(0)

        avg_loss = total_loss / len(self.train_loader)
        accuracy = correct / total

        return avg_loss, accuracy

    @torch.no_grad()
    def validate(self):
        """Validate the model"""
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

        # Synchronize metrics across GPUs
        if self.config.distributed:
            metrics = torch.tensor([total_loss, correct, total], device=self.device)
            dist.all_reduce(metrics)
            total_loss, correct, total = metrics.tolist()

        avg_loss = total_loss / len(self.val_loader)
        accuracy = correct / total

        return avg_loss, accuracy

    def save_checkpoint(self, filename):
        """Save training checkpoint"""
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
        logger.info(f"Checkpoint saved to {path}")

    def train(self):
        """Main training loop"""
        logger.info("Starting training...")

        for epoch in range(self.current_epoch, self.config.epochs):
            self.current_epoch = epoch

            # Train
            train_loss, train_acc = self.train_epoch()

            # Validate
            val_loss, val_acc = self.validate()

            # Logging
            if self.rank == 0:
                logger.info(
                    f"Epoch {epoch + 1}/{self.config.epochs} - "
                    f"Train Loss: {train_loss:.4f}, Train Acc: {train_acc*100:.2f}% - "
                    f"Val Loss: {val_loss:.4f}, Val Acc: {val_acc*100:.2f}%"
                )

            # Checkpointing
            if (epoch + 1) % self.config.save_every == 0:
                self.save_checkpoint(f'checkpoint_epoch_{epoch + 1}.pt')

            # Best model
            if val_loss < self.best_val_loss:
                self.best_val_loss = val_loss
                self.save_checkpoint('best_model.pt')
                self.patience_counter = 0
            else:
                self.patience_counter += 1

            # Early stopping
            if self.patience_counter >= self.config.patience:
                if self.rank == 0:
                    logger.info(f"Early stopping at epoch {epoch + 1}")
                break

        # Cleanup
        if self.config.distributed:
            dist.destroy_process_group()
```

---

## Best Practices and Common Pitfalls

### Best Practices

#### Learning Rate

```python
# Use learning rate finder before training
lrs, losses = lr_finder(model, train_loader, optimizer, criterion)
best_lr = lrs[losses.index(min(losses))] / 10  # Use 1/10 of the best found

# Scale learning rate with batch size
def scaled_lr(base_lr, base_batch, actual_batch):
    return base_lr * (actual_batch / base_batch)

# Use warmup for large batch sizes or transformers
# Warmup for ~5-10% of total training steps

# Prefer OneCycleLR or cosine annealing over step decay
```

#### Gradient Handling

```python
# Always clip gradients when training RNNs/Transformers
torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)

# Monitor gradient norms
total_norm = sum(p.grad.data.norm(2).item() ** 2 for p in model.parameters()) ** 0.5

# Use gradient accumulation for memory-constrained scenarios
effective_batch_size = batch_size * accumulation_steps * world_size
```

#### Mixed Precision

```python
# Always use GradScaler with AMP
scaler = GradScaler()

# Unscale gradients before clipping
scaler.unscale_(optimizer)
torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)

# Some operations need FP32 (handled automatically by autocast)
# - Softmax, log_softmax, cross_entropy
# - BatchNorm, LayerNorm
```

#### Distributed Training

```python
# Always set epoch in DistributedSampler
sampler.set_epoch(epoch)

# Save and load checkpoints from rank 0 only
if rank == 0:
    torch.save(checkpoint, path)

# Use SyncBatchNorm for multi-GPU training
model = nn.SyncBatchNorm.convert_sync_batchnorm(model)

# Synchronize metrics before logging
dist.all_reduce(loss_tensor)
```

### Common Pitfalls

```python
# WRONG: Forgetting to set epoch for sampler
for epoch in range(epochs):
    for data in train_loader:  # Will use same order each epoch!
        pass

# CORRECT:
for epoch in range(epochs):
    sampler.set_epoch(epoch)  # Essential for proper shuffling
    for data in train_loader:
        pass

# WRONG: Not handling gradient accumulation properly
for batch in dataloader:
    loss = criterion(model(batch), target)
    loss.backward()
    if step % accum_steps == 0:
        optimizer.step()
        # Missing: optimizer.zero_grad()

# CORRECT:
for batch in dataloader:
    loss = criterion(model(batch), target) / accum_steps  # Scale loss
    loss.backward()
    if step % accum_steps == 0:
        optimizer.step()
        optimizer.zero_grad()

# WRONG: Calling scheduler.step() with OneCycleLR per epoch
for epoch in range(epochs):
    train()
    scheduler.step()  # Wrong! OneCycleLR needs per-step updates

# CORRECT:
for epoch in range(epochs):
    for batch in train_loader:
        train_step()
        scheduler.step()  # Per batch/step
```

---

## Interview Questions

### Fundamental Questions

**Q1: Explain the purpose and mechanism of learning rate warmup.**

Warmup gradually increases the learning rate from a small value to the target value during the initial training phase. This is important because:

1. **Prevents early divergence**: Large gradients at initialization can cause the model to diverge if learning rate is too high
2. **Allows batch statistics to stabilize**: BatchNorm statistics are unreliable early in training
3. **Enables larger batch sizes**: Linear scaling rule requires warmup to work properly
4. **Required for transformers**: Self-attention gradients can be unstable initially

```python
# Linear warmup implementation
warmup_lr = base_lr * (current_step / warmup_steps)
```

**Q2: What are the differences between DataParallel and DistributedDataParallel?**

| Aspect | DataParallel | DistributedDataParallel |
|--------|--------------|------------------------|
| Communication | All-gather through Python GIL | NCCL all-reduce |
| Efficiency | Lower (GIL bottleneck) | Higher (overlapped communication) |
| Memory | Master GPU uses more | Evenly distributed |
| Multi-node | Not supported | Fully supported |
| Batch handling | Automatic splitting | Manual with DistributedSampler |

**Q3: How does mixed precision training maintain accuracy while using FP16?**

Mixed precision maintains accuracy through:

1. **Loss scaling**: Multiply loss by a scale factor to prevent underflow during FP16 backward pass
2. **FP32 master weights**: Keep FP32 copy of weights for accumulation
3. **Selective precision**: Some operations (softmax, norms) remain in FP32
4. **Dynamic scaling**: GradScaler automatically adjusts scale factor to avoid overflow/underflow

**Q4: Explain gradient accumulation and when to use it.**

Gradient accumulation simulates larger batch sizes by:

1. Running multiple forward-backward passes
2. Accumulating gradients without zeroing
3. Performing optimizer step after N accumulation steps

Use cases:
- GPU memory is insufficient for desired batch size
- Training transformers that benefit from large batch sizes
- Simulating multi-GPU training on single GPU

### Advanced Questions

**Q5: Design a training system for a 10B parameter model using a cluster of 8-GPU nodes.**

Key considerations:

1. **Parallelism strategy**:
   - Data Parallelism: Replicate model, split data
   - Model/Tensor Parallelism: Split layers across GPUs
   - Pipeline Parallelism: Split model into stages

2. **Memory optimization**:
   - Mixed precision (BF16/FP16)
   - Gradient checkpointing
   - ZeRO optimizer states partitioning

3. **Communication efficiency**:
   - Overlap computation and communication
   - Gradient compression if bandwidth limited

**Q6: Why might training diverge even with gradient clipping?**

Possible causes:

1. **Clip threshold too high**: Does not prevent explosion
2. **Clip threshold too low**: Prevents learning, causes instability
3. **Loss scaling issues**: In AMP, scale might be incorrect
4. **NaN propagation**: NaN in forward pass bypasses clipping
5. **Learning rate too high**: Clipping does not help if updates are inherently unstable

**Q7: Compare GPipe and PipeDream scheduling strategies.**

| Aspect | GPipe | PipeDream (1F1B) |
|--------|-------|------------------|
| Memory | High (stores all activations) | Lower (releases early) |
| Bubble ratio | Higher | Lower |
| Implementation | Simpler | More complex |
| Weight updates | Synchronous | Can be asynchronous |
| Gradient staleness | None | Possible with async |

---

## Summary

This guide covered essential deep learning training techniques:

1. **Learning Rate Scheduling**: Step decay, cosine annealing, warmup strategies, and OneCycleLR
2. **Mixed Precision Training**: AMP with autocast and GradScaler for faster training
3. **Gradient Accumulation**: Simulate larger batch sizes with limited memory
4. **Gradient Clipping**: Prevent exploding gradients in RNNs and transformers
5. **Distributed Data Parallel**: Efficient multi-GPU training with NCCL
6. **Model Parallelism**: Split large models across GPUs
7. **Pipeline Parallelism**: Efficient sequential model partitioning

Key takeaways:
- Start with baseline, then add techniques incrementally
- Monitor training metrics (loss, gradients, learning rate)
- Use DDP over DataParallel for distributed training
- Enable AMP by default on modern GPUs
- Scale learning rate with effective batch size
- Always use gradient clipping for transformers/RNNs

---

## Further Reading

### Papers

- "Accurate, Large Minibatch SGD: Training ImageNet in 1 Hour" - Linear scaling rule
- "Mixed Precision Training" - NVIDIA mixed precision methodology
- "GPipe: Efficient Training of Giant Neural Networks" - Pipeline parallelism
- "Megatron-LM: Training Multi-Billion Parameter Language Models" - Model parallelism
- "ZeRO: Memory Optimizations Toward Training Trillion Parameter Models" - Memory optimization

### Documentation

- [PyTorch Distributed Training](https://pytorch.org/tutorials/intermediate/ddp_tutorial.html)
- [PyTorch AMP](https://pytorch.org/docs/stable/amp.html)
- [NVIDIA Mixed Precision Training](https://developer.nvidia.com/automatic-mixed-precision)

### Frameworks

- DeepSpeed: Microsoft distributed training library
- FairScale: Facebook training utilities
- PyTorch Lightning: High-level training framework
- Hugging Face Accelerate: Simple distributed training
