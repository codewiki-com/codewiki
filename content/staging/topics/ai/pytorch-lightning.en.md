---
title: PyTorch Lightning
description: Simplify deep learning training with PyTorch Lightning
track: ai
section: deep-learning
difficulty: intermediate
tags:
  - PyTorch Lightning
  - deep learning
  - training
  - framework
status: imported
origin: old/src/content/docs/ai/pytorch-lightning.en.md
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

PyTorch Lightning is a lightweight wrapper around PyTorch that helps organize deep learning code while removing boilerplate. It provides a high-level interface for training models while giving you full control over the underlying PyTorch code.

---

## Lightning vs Vanilla PyTorch

### The Problem with Vanilla PyTorch

In vanilla PyTorch, training code often becomes cluttered with engineering concerns mixed with research logic. A typical training loop requires handling:

- Device management (CPU/GPU)
- Gradient zeroing and accumulation
- Mixed precision training
- Distributed training setup
- Checkpointing
- Logging
- Early stopping

**Vanilla PyTorch Training Loop:**

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader

# Model definition
model = nn.Sequential(
    nn.Linear(784, 256),
    nn.ReLU(),
    nn.Linear(256, 10)
)

# Setup
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = model.to(device)
optimizer = optim.Adam(model.parameters(), lr=1e-3)
criterion = nn.CrossEntropyLoss()

# Training loop - lots of boilerplate!
for epoch in range(num_epochs):
    model.train()
    for batch_idx, (data, target) in enumerate(train_loader):
        # Manual device transfer
        data, target = data.to(device), target.to(device)

        # Manual gradient management
        optimizer.zero_grad()
        output = model(data)
        loss = criterion(output, target)
        loss.backward()
        optimizer.step()

        # Manual logging
        if batch_idx % 100 == 0:
            print(f'Epoch {epoch}, Batch {batch_idx}, Loss: {loss.item():.4f}')

    # Manual validation
    model.eval()
    val_loss = 0
    correct = 0
    with torch.no_grad():
        for data, target in val_loader:
            data, target = data.to(device), target.to(device)
            output = model(data)
            val_loss += criterion(output, target).item()
            pred = output.argmax(dim=1)
            correct += pred.eq(target).sum().item()

    # Manual metric calculation
    val_loss /= len(val_loader)
    accuracy = correct / len(val_loader.dataset)
    print(f'Validation Loss: {val_loss:.4f}, Accuracy: {accuracy:.4f}')

    # Manual checkpointing
    if val_loss < best_val_loss:
        torch.save(model.state_dict(), 'best_model.pt')
        best_val_loss = val_loss
```

### The Lightning Solution

PyTorch Lightning separates research code (model, loss, optimizer) from engineering code (training loop, device management, logging). This makes your code:

- **More readable**: Focus on what matters
- **More reproducible**: Standardized structure
- **More scalable**: Easy multi-GPU/TPU support
- **More maintainable**: Clear separation of concerns

**Same Model with PyTorch Lightning:**

```python
import lightning as L
import torch
import torch.nn as nn
import torch.nn.functional as F

class LitClassifier(L.LightningModule):
    def __init__(self, input_size=784, hidden_size=256, num_classes=10, lr=1e-3):
        super().__init__()
        self.save_hyperparameters()

        self.model = nn.Sequential(
            nn.Linear(input_size, hidden_size),
            nn.ReLU(),
            nn.Linear(hidden_size, num_classes)
        )

    def forward(self, x):
        return self.model(x)

    def training_step(self, batch, batch_idx):
        x, y = batch
        logits = self(x)
        loss = F.cross_entropy(logits, y)
        self.log('train_loss', loss, prog_bar=True)
        return loss

    def validation_step(self, batch, batch_idx):
        x, y = batch
        logits = self(x)
        loss = F.cross_entropy(logits, y)
        acc = (logits.argmax(dim=1) == y).float().mean()
        self.log('val_loss', loss, prog_bar=True)
        self.log('val_acc', acc, prog_bar=True)

    def configure_optimizers(self):
        return torch.optim.Adam(self.parameters(), lr=self.hparams.lr)

# Training is now just 3 lines!
model = LitClassifier()
trainer = L.Trainer(max_epochs=10)
trainer.fit(model, train_loader, val_loader)
```

### Key Differences Summary

| Aspect | Vanilla PyTorch | PyTorch Lightning |
|--------|-----------------|-------------------|
| Device management | Manual `.to(device)` | Automatic |
| Gradient handling | Manual `zero_grad()`, `backward()`, `step()` | Automatic |
| Training loop | Write from scratch | Built-in |
| Multi-GPU | Complex setup required | One flag change |
| Logging | Manual implementation | Built-in integrations |
| Checkpointing | Manual save/load | Automatic |
| Mixed precision | Manual AMP handling | One flag change |

---

## LightningModule

The `LightningModule` is the core abstraction in PyTorch Lightning. It organizes your PyTorch code into a standardized structure with specific methods for each part of the training process.

### Essential Methods

```python
import lightning as L
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchmetrics import Accuracy

class ImageClassifier(L.LightningModule):
    def __init__(self, num_classes=10, learning_rate=1e-3):
        super().__init__()
        # Automatically saves all __init__ arguments to self.hparams
        self.save_hyperparameters()

        # Define model architecture
        self.conv1 = nn.Conv2d(3, 32, 3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, 3, padding=1)
        self.pool = nn.MaxPool2d(2, 2)
        self.fc1 = nn.Linear(64 * 8 * 8, 512)
        self.fc2 = nn.Linear(512, num_classes)
        self.dropout = nn.Dropout(0.5)

        # Metrics
        self.train_acc = Accuracy(task='multiclass', num_classes=num_classes)
        self.val_acc = Accuracy(task='multiclass', num_classes=num_classes)

    def forward(self, x):
        """Define the forward pass - used for inference."""
        x = self.pool(F.relu(self.conv1(x)))
        x = self.pool(F.relu(self.conv2(x)))
        x = x.view(x.size(0), -1)
        x = self.dropout(F.relu(self.fc1(x)))
        x = self.fc2(x)
        return x

    def training_step(self, batch, batch_idx):
        """Define a single training step."""
        x, y = batch
        logits = self(x)
        loss = F.cross_entropy(logits, y)

        # Log metrics
        self.train_acc(logits, y)
        self.log('train_loss', loss, on_step=True, on_epoch=True, prog_bar=True)
        self.log('train_acc', self.train_acc, on_step=False, on_epoch=True, prog_bar=True)

        return loss

    def validation_step(self, batch, batch_idx):
        """Define a single validation step."""
        x, y = batch
        logits = self(x)
        loss = F.cross_entropy(logits, y)

        self.val_acc(logits, y)
        self.log('val_loss', loss, prog_bar=True)
        self.log('val_acc', self.val_acc, prog_bar=True)

    def test_step(self, batch, batch_idx):
        """Define a single test step."""
        x, y = batch
        logits = self(x)
        loss = F.cross_entropy(logits, y)
        acc = (logits.argmax(dim=1) == y).float().mean()

        self.log('test_loss', loss)
        self.log('test_acc', acc)

    def predict_step(self, batch, batch_idx):
        """Define prediction step for inference."""
        x, _ = batch
        logits = self(x)
        return logits.argmax(dim=1)

    def configure_optimizers(self):
        """Configure optimizers and learning rate schedulers."""
        optimizer = torch.optim.AdamW(
            self.parameters(),
            lr=self.hparams.learning_rate,
            weight_decay=0.01
        )
        scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
            optimizer,
            T_max=self.trainer.max_epochs,
            eta_min=1e-6
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

### Lifecycle Hooks

Lightning provides hooks for every stage of training:

```python
class ModelWithHooks(L.LightningModule):
    def __init__(self):
        super().__init__()
        self.model = nn.Linear(10, 2)

    # Called at the beginning of fit (train + validate)
    def on_fit_start(self):
        print("Starting training!")

    # Called at the beginning of each epoch
    def on_train_epoch_start(self):
        print(f"Starting epoch {self.current_epoch}")

    # Called before each training batch
    def on_train_batch_start(self, batch, batch_idx):
        pass

    # Called after each training batch
    def on_train_batch_end(self, outputs, batch, batch_idx):
        pass

    # Called at the end of each epoch
    def on_train_epoch_end(self):
        # Access all logged metrics
        avg_loss = self.trainer.callback_metrics.get('train_loss')
        print(f"Epoch {self.current_epoch} average loss: {avg_loss}")

    # Called at the end of validation
    def on_validation_epoch_end(self):
        pass

    # Called at the end of fit
    def on_fit_end(self):
        print("Training complete!")

    def training_step(self, batch, batch_idx):
        x, y = batch
        loss = F.cross_entropy(self.model(x), y)
        self.log('train_loss', loss)
        return loss

    def configure_optimizers(self):
        return torch.optim.Adam(self.parameters())
```

### Accessing Training State

The `LightningModule` provides access to useful training state:

```python
class ModelWithState(L.LightningModule):
    def training_step(self, batch, batch_idx):
        # Access current epoch
        current_epoch = self.current_epoch

        # Access global step (total batches processed)
        global_step = self.global_step

        # Access trainer reference
        max_epochs = self.trainer.max_epochs

        # Access logger
        self.logger.experiment.add_scalar('custom_metric', value, global_step)

        # Access device
        device = self.device

        # Check if using GPU
        if self.on_gpu:
            print("Training on GPU")

        # Access hyperparameters
        lr = self.hparams.learning_rate

        x, y = batch
        loss = self.compute_loss(x, y)
        return loss
```

---

## Trainer

The `Trainer` handles all the training engineering and provides a clean interface for controlling training behavior.

### Basic Usage

```python
import lightning as L

# Basic trainer
trainer = L.Trainer(max_epochs=10)
trainer.fit(model, train_dataloader, val_dataloader)

# Test the model
trainer.test(model, test_dataloader)

# Make predictions
predictions = trainer.predict(model, predict_dataloader)
```

### Important Trainer Arguments

```python
trainer = L.Trainer(
    # Training duration
    max_epochs=100,
    max_steps=-1,  # -1 means no limit
    min_epochs=1,

    # Hardware
    accelerator='auto',  # 'cpu', 'gpu', 'tpu', 'auto'
    devices='auto',      # Number of devices or 'auto'
    precision='32-true', # '16-mixed', 'bf16-mixed', '32-true'

    # Distributed training
    strategy='auto',     # 'ddp', 'deepspeed', 'fsdp', 'auto'
    num_nodes=1,

    # Gradient handling
    accumulate_grad_batches=1,
    gradient_clip_val=1.0,
    gradient_clip_algorithm='norm',  # 'norm' or 'value'

    # Validation
    val_check_interval=1.0,    # Check val every epoch (1.0) or every N batches (int)
    check_val_every_n_epoch=1,
    num_sanity_val_steps=2,    # Run N val batches before training

    # Logging
    logger=True,               # Default TensorBoard logger
    log_every_n_steps=50,
    enable_progress_bar=True,

    # Checkpointing
    enable_checkpointing=True,
    default_root_dir='./lightning_logs',

    # Debugging
    fast_dev_run=False,        # Run 1 batch of train, val, test for debugging
    limit_train_batches=1.0,   # Use subset of training data
    limit_val_batches=1.0,
    limit_test_batches=1.0,
    overfit_batches=0,         # Overfit on N batches for debugging

    # Callbacks
    callbacks=[],

    # Reproducibility
    deterministic=False,
)
```

### Resuming Training

```python
# Resume from checkpoint
trainer = L.Trainer(max_epochs=100)
trainer.fit(model, train_loader, ckpt_path='path/to/checkpoint.ckpt')

# Or load weights only (no training state)
model = LitModel.load_from_checkpoint('path/to/checkpoint.ckpt')
```

### Fast Development Run

```python
# Quick test that the full train/val/test loop works
trainer = L.Trainer(fast_dev_run=True)
trainer.fit(model, train_loader, val_loader)

# Run only N batches per epoch
trainer = L.Trainer(
    limit_train_batches=10,
    limit_val_batches=5,
    max_epochs=3
)

# Overfit on a small subset to verify model can learn
trainer = L.Trainer(overfit_batches=10, max_epochs=100)
```

---

## Callbacks

Callbacks allow you to hook into the training loop without modifying your model code. Lightning provides many built-in callbacks and allows custom ones.

### Built-in Callbacks

```python
from lightning.pytorch.callbacks import (
    ModelCheckpoint,
    EarlyStopping,
    LearningRateMonitor,
    RichProgressBar,
    TQDMProgressBar,
    DeviceStatsMonitor,
    ModelSummary,
    GradientAccumulationScheduler,
)

# Model Checkpointing - save best and last models
checkpoint_callback = ModelCheckpoint(
    dirpath='checkpoints/',
    filename='model-{epoch:02d}-{val_loss:.2f}',
    save_top_k=3,           # Save top 3 models
    monitor='val_loss',     # Metric to monitor
    mode='min',             # 'min' for loss, 'max' for accuracy
    save_last=True,         # Also save the last model
    save_weights_only=False,# Save full checkpoint or just weights
    every_n_epochs=1,
    verbose=True,
)

# Early Stopping - stop when metric stops improving
early_stop_callback = EarlyStopping(
    monitor='val_loss',
    patience=10,            # Wait 10 epochs before stopping
    mode='min',
    min_delta=0.001,        # Minimum change to qualify as improvement
    verbose=True,
    strict=True,
)

# Learning Rate Monitor - log LR to logger
lr_monitor = LearningRateMonitor(
    logging_interval='step',  # 'step' or 'epoch'
    log_momentum=True,
)

# Gradient Accumulation Schedule
grad_accumulation = GradientAccumulationScheduler(
    scheduling={0: 8, 4: 4, 8: 1}  # epoch: accumulate_grad_batches
)

# Combine callbacks
trainer = L.Trainer(
    max_epochs=100,
    callbacks=[
        checkpoint_callback,
        early_stop_callback,
        lr_monitor,
        ModelSummary(max_depth=2),
    ]
)
```

### Custom Callbacks

```python
from lightning.pytorch.callbacks import Callback

class PrintCallback(Callback):
    """Simple callback that prints messages at various stages."""

    def on_train_start(self, trainer, pl_module):
        print("Training is starting!")

    def on_train_end(self, trainer, pl_module):
        print("Training is done.")

class MetricsCallback(Callback):
    """Callback to collect and store metrics during training."""

    def __init__(self):
        self.train_losses = []
        self.val_losses = []

    def on_train_epoch_end(self, trainer, pl_module):
        train_loss = trainer.callback_metrics.get('train_loss')
        if train_loss is not None:
            self.train_losses.append(train_loss.item())

    def on_validation_epoch_end(self, trainer, pl_module):
        val_loss = trainer.callback_metrics.get('val_loss')
        if val_loss is not None:
            self.val_losses.append(val_loss.item())

class GradientLoggerCallback(Callback):
    """Log gradient statistics for debugging."""

    def on_after_backward(self, trainer, pl_module):
        if trainer.global_step % 100 == 0:
            for name, param in pl_module.named_parameters():
                if param.grad is not None:
                    grad_norm = param.grad.norm()
                    pl_module.log(f'grad_norm/{name}', grad_norm)

class FreezeUnfreezeCallback(Callback):
    """Freeze encoder for first N epochs, then unfreeze."""

    def __init__(self, unfreeze_epoch=5):
        self.unfreeze_epoch = unfreeze_epoch

    def on_train_epoch_start(self, trainer, pl_module):
        if trainer.current_epoch < self.unfreeze_epoch:
            # Freeze encoder
            for param in pl_module.encoder.parameters():
                param.requires_grad = False
        else:
            # Unfreeze encoder
            for param in pl_module.encoder.parameters():
                param.requires_grad = True

# Use custom callbacks
metrics_cb = MetricsCallback()
trainer = L.Trainer(
    max_epochs=10,
    callbacks=[
        PrintCallback(),
        metrics_cb,
        GradientLoggerCallback(),
    ]
)
trainer.fit(model, train_loader, val_loader)

# Access collected metrics
print(f"Train losses: {metrics_cb.train_losses}")
print(f"Val losses: {metrics_cb.val_losses}")
```

---

## Logging

PyTorch Lightning integrates with popular logging frameworks and provides a unified interface.

### Built-in Logging

```python
class ModelWithLogging(L.LightningModule):
    def training_step(self, batch, batch_idx):
        x, y = batch
        logits = self(x)
        loss = F.cross_entropy(logits, y)
        acc = (logits.argmax(dim=1) == y).float().mean()

        # Basic logging
        self.log('train_loss', loss)

        # Log with options
        self.log('train_acc', acc,
            on_step=True,      # Log at each step
            on_epoch=True,     # Also log epoch average
            prog_bar=True,     # Show in progress bar
            logger=True,       # Log to logger
            sync_dist=True,    # Sync across GPUs in distributed
        )

        # Log multiple metrics at once
        self.log_dict({
            'train_loss': loss,
            'train_acc': acc,
        }, prog_bar=True)

        return loss
```

### TensorBoard Logger

```python
from lightning.pytorch.loggers import TensorBoardLogger

logger = TensorBoardLogger(
    save_dir='logs/',
    name='my_experiment',
    version='v1',
    log_graph=True,
    default_hp_metric=False,
)

trainer = L.Trainer(logger=logger, max_epochs=10)

# In your model, you can also log images, histograms, etc.
class ModelWithTensorBoard(L.LightningModule):
    def training_step(self, batch, batch_idx):
        x, y = batch
        logits = self(x)
        loss = F.cross_entropy(logits, y)

        # Log scalar
        self.log('train_loss', loss)

        # Log images (every 100 steps)
        if batch_idx % 100 == 0:
            # Access TensorBoard writer directly
            tensorboard = self.logger.experiment
            tensorboard.add_images('input_images', x[:4], self.global_step)

            # Log histogram of weights
            for name, param in self.named_parameters():
                tensorboard.add_histogram(name, param, self.global_step)

        return loss
```

### Weights and Biases Logger

```python
from lightning.pytorch.loggers import WandbLogger
import wandb

wandb_logger = WandbLogger(
    project='my-project',
    name='experiment-1',
    log_model='all',  # Log all checkpoints
    save_dir='logs/',
)

trainer = L.Trainer(logger=wandb_logger, max_epochs=10)

# Log additional data
class ModelWithWandB(L.LightningModule):
    def training_step(self, batch, batch_idx):
        x, y = batch
        logits = self(x)
        loss = F.cross_entropy(logits, y)

        self.log('train_loss', loss)

        # Log to wandb directly
        if batch_idx % 100 == 0:
            self.logger.experiment.log({
                'examples': wandb.Image(x[0]),
                'predictions': wandb.Histogram(logits.detach().cpu()),
            })

        return loss
```

### Multiple Loggers

```python
from lightning.pytorch.loggers import TensorBoardLogger, CSVLogger, WandbLogger

# Use multiple loggers simultaneously
tensorboard_logger = TensorBoardLogger('logs/', name='tensorboard')
csv_logger = CSVLogger('logs/', name='csv')

trainer = L.Trainer(
    logger=[tensorboard_logger, csv_logger],
    max_epochs=10
)
```

### CSV Logger for Simple Logging

```python
from lightning.pytorch.loggers import CSVLogger

csv_logger = CSVLogger(
    save_dir='logs/',
    name='my_experiment',
    version='v1',
    flush_logs_every_n_steps=100,
)

trainer = L.Trainer(logger=csv_logger, max_epochs=10)
trainer.fit(model, train_loader)

# Logs saved to logs/my_experiment/v1/metrics.csv
```

---

## Distributed Training

PyTorch Lightning makes distributed training simple with minimal code changes.

### Single GPU Training

```python
# Automatically uses GPU if available
trainer = L.Trainer(accelerator='auto', devices='auto')

# Explicitly use GPU
trainer = L.Trainer(accelerator='gpu', devices=1)
```

### Multi-GPU Training (DDP)

```python
# Train on 4 GPUs with Distributed Data Parallel
trainer = L.Trainer(
    accelerator='gpu',
    devices=4,
    strategy='ddp'
)

# Train on all available GPUs
trainer = L.Trainer(
    accelerator='gpu',
    devices='auto',
    strategy='ddp'
)
```

### Multi-Node Training

```python
# Train on 4 nodes with 8 GPUs each (32 GPUs total)
trainer = L.Trainer(
    accelerator='gpu',
    devices=8,
    num_nodes=4,
    strategy='ddp'
)
```

### Handling Distributed Logging

When training on multiple GPUs, you need to handle logging carefully:

```python
class DistributedModel(L.LightningModule):
    def validation_step(self, batch, batch_idx):
        x, y = batch
        logits = self(x)
        loss = F.cross_entropy(logits, y)

        # sync_dist=True ensures metrics are averaged across all GPUs
        self.log('val_loss', loss, sync_dist=True)

        return loss

    def on_validation_epoch_end(self):
        # Only run on rank 0 to avoid duplicate logging
        if self.trainer.is_global_zero:
            print(f"Validation complete on epoch {self.current_epoch}")
```

### Mixed Precision Training

```python
# 16-bit mixed precision (faster, less memory)
trainer = L.Trainer(
    accelerator='gpu',
    devices=4,
    precision='16-mixed'
)

# BFloat16 mixed precision (better for newer GPUs)
trainer = L.Trainer(
    accelerator='gpu',
    devices=4,
    precision='bf16-mixed'
)
```

### DeepSpeed Integration

```python
# DeepSpeed ZeRO Stage 2 (memory efficient)
trainer = L.Trainer(
    accelerator='gpu',
    devices=8,
    strategy='deepspeed_stage_2',
    precision='16-mixed'
)

# DeepSpeed ZeRO Stage 3 (most memory efficient)
trainer = L.Trainer(
    accelerator='gpu',
    devices=8,
    strategy='deepspeed_stage_3',
    precision='16-mixed'
)
```

### FSDP (Fully Sharded Data Parallel)

```python
from lightning.pytorch.strategies import FSDPStrategy

# FSDP for large models
strategy = FSDPStrategy(
    sharding_strategy='FULL_SHARD',
    cpu_offload=True,
)

trainer = L.Trainer(
    accelerator='gpu',
    devices=8,
    strategy=strategy,
    precision='16-mixed'
)
```

### Distributed Training Example

```python
import lightning as L
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, random_split
from torchvision import datasets, transforms

class DistributedClassifier(L.LightningModule):
    def __init__(self, num_classes=10, lr=1e-3):
        super().__init__()
        self.save_hyperparameters()

        self.model = nn.Sequential(
            nn.Conv2d(1, 32, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Flatten(),
            nn.Linear(64 * 7 * 7, 128),
            nn.ReLU(),
            nn.Linear(128, num_classes)
        )

    def forward(self, x):
        return self.model(x)

    def training_step(self, batch, batch_idx):
        x, y = batch
        logits = self(x)
        loss = F.cross_entropy(logits, y)
        acc = (logits.argmax(dim=1) == y).float().mean()

        self.log('train_loss', loss, prog_bar=True, sync_dist=True)
        self.log('train_acc', acc, prog_bar=True, sync_dist=True)
        return loss

    def validation_step(self, batch, batch_idx):
        x, y = batch
        logits = self(x)
        loss = F.cross_entropy(logits, y)
        acc = (logits.argmax(dim=1) == y).float().mean()

        self.log('val_loss', loss, prog_bar=True, sync_dist=True)
        self.log('val_acc', acc, prog_bar=True, sync_dist=True)

    def configure_optimizers(self):
        return torch.optim.Adam(self.parameters(), lr=self.hparams.lr)

# Prepare data
transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.1307,), (0.3081,))
])

dataset = datasets.MNIST('.', train=True, download=True, transform=transform)
train_set, val_set = random_split(dataset, [55000, 5000])

train_loader = DataLoader(train_set, batch_size=64, shuffle=True, num_workers=4)
val_loader = DataLoader(val_set, batch_size=64, num_workers=4)

# Train on multiple GPUs
model = DistributedClassifier()
trainer = L.Trainer(
    accelerator='gpu',
    devices=4,
    strategy='ddp',
    precision='16-mixed',
    max_epochs=10,
    callbacks=[
        L.pytorch.callbacks.ModelCheckpoint(monitor='val_acc', mode='max'),
        L.pytorch.callbacks.EarlyStopping(monitor='val_loss', patience=3),
    ]
)
trainer.fit(model, train_loader, val_loader)
```

---

## Best Practices

### Use save_hyperparameters()

```python
class GoodModel(L.LightningModule):
    def __init__(self, hidden_size=256, lr=1e-3, dropout=0.5):
        super().__init__()
        # Automatically saves all args to self.hparams
        self.save_hyperparameters()

        # Access via self.hparams.hidden_size
        self.layer = nn.Linear(784, self.hparams.hidden_size)

    def configure_optimizers(self):
        # Use saved hyperparameters
        return torch.optim.Adam(self.parameters(), lr=self.hparams.lr)
```

### Use LightningDataModule

```python
class MNISTDataModule(L.LightningDataModule):
    def __init__(self, data_dir='./', batch_size=64, num_workers=4):
        super().__init__()
        self.save_hyperparameters()
        self.transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize((0.1307,), (0.3081,))
        ])

    def prepare_data(self):
        # Download data (called only on 1 GPU)
        datasets.MNIST(self.hparams.data_dir, train=True, download=True)
        datasets.MNIST(self.hparams.data_dir, train=False, download=True)

    def setup(self, stage=None):
        # Create datasets (called on each GPU)
        if stage == 'fit' or stage is None:
            mnist_full = datasets.MNIST(
                self.hparams.data_dir, train=True, transform=self.transform
            )
            self.mnist_train, self.mnist_val = random_split(
                mnist_full, [55000, 5000]
            )

        if stage == 'test' or stage is None:
            self.mnist_test = datasets.MNIST(
                self.hparams.data_dir, train=False, transform=self.transform
            )

    def train_dataloader(self):
        return DataLoader(
            self.mnist_train,
            batch_size=self.hparams.batch_size,
            shuffle=True,
            num_workers=self.hparams.num_workers,
            pin_memory=True
        )

    def val_dataloader(self):
        return DataLoader(
            self.mnist_val,
            batch_size=self.hparams.batch_size,
            num_workers=self.hparams.num_workers,
            pin_memory=True
        )

    def test_dataloader(self):
        return DataLoader(
            self.mnist_test,
            batch_size=self.hparams.batch_size,
            num_workers=self.hparams.num_workers,
            pin_memory=True
        )

# Use with trainer
datamodule = MNISTDataModule(batch_size=128)
trainer = L.Trainer(max_epochs=10)
trainer.fit(model, datamodule)
trainer.test(model, datamodule)
```

### Proper Metric Logging

```python
from torchmetrics import Accuracy, F1Score, MetricCollection

class ModelWithProperMetrics(L.LightningModule):
    def __init__(self, num_classes=10):
        super().__init__()
        self.save_hyperparameters()

        # Use torchmetrics for proper metric computation
        metrics = MetricCollection({
            'acc': Accuracy(task='multiclass', num_classes=num_classes),
            'f1': F1Score(task='multiclass', num_classes=num_classes, average='macro'),
        })

        # Clone for train and val to track separately
        self.train_metrics = metrics.clone(prefix='train_')
        self.val_metrics = metrics.clone(prefix='val_')

    def training_step(self, batch, batch_idx):
        x, y = batch
        logits = self(x)
        loss = F.cross_entropy(logits, y)

        # Update metrics
        self.train_metrics(logits, y)
        self.log('train_loss', loss, prog_bar=True)
        self.log_dict(self.train_metrics, on_epoch=True)

        return loss

    def validation_step(self, batch, batch_idx):
        x, y = batch
        logits = self(x)
        loss = F.cross_entropy(logits, y)

        self.val_metrics(logits, y)
        self.log('val_loss', loss, prog_bar=True)
        self.log_dict(self.val_metrics)
```

### Use Callbacks for Reusable Logic

```python
# Instead of putting everything in the model:
class CleanModel(L.LightningModule):
    """Keep the model focused on forward pass and loss computation."""

    def __init__(self, backbone):
        super().__init__()
        self.backbone = backbone
        self.classifier = nn.Linear(512, 10)

    def forward(self, x):
        features = self.backbone(x)
        return self.classifier(features)

    def training_step(self, batch, batch_idx):
        x, y = batch
        logits = self(x)
        loss = F.cross_entropy(logits, y)
        self.log('train_loss', loss)
        return loss

    def configure_optimizers(self):
        return torch.optim.Adam(self.parameters(), lr=1e-3)

# Put auxiliary logic in callbacks
class FineTuningCallback(Callback):
    def __init__(self, unfreeze_epoch=5):
        self.unfreeze_epoch = unfreeze_epoch

    def on_train_start(self, trainer, pl_module):
        # Freeze backbone initially
        for param in pl_module.backbone.parameters():
            param.requires_grad = False

    def on_train_epoch_start(self, trainer, pl_module):
        if trainer.current_epoch == self.unfreeze_epoch:
            # Unfreeze backbone
            for param in pl_module.backbone.parameters():
                param.requires_grad = True
            print(f"Unfreezing backbone at epoch {self.unfreeze_epoch}")
```

### Debug Effectively

```python
# Quick sanity check
trainer = L.Trainer(fast_dev_run=True)
trainer.fit(model, train_loader, val_loader)

# Overfit on small batch to verify model can learn
trainer = L.Trainer(overfit_batches=10, max_epochs=50)
trainer.fit(model, train_loader)

# Limit batches for quick iteration
trainer = L.Trainer(
    limit_train_batches=0.1,  # Use 10% of training data
    limit_val_batches=0.1,
    max_epochs=5
)

# Enable anomaly detection for debugging NaN losses
torch.autograd.set_detect_anomaly(True)
```

### Proper Checkpointing

```python
from lightning.pytorch.callbacks import ModelCheckpoint

# Save top 3 models by validation accuracy
checkpoint_callback = ModelCheckpoint(
    dirpath='checkpoints/',
    filename='{epoch}-{val_acc:.3f}',
    monitor='val_acc',
    mode='max',
    save_top_k=3,
    save_last=True,
)

trainer = L.Trainer(callbacks=[checkpoint_callback])
trainer.fit(model, datamodule)

# Load best checkpoint
best_model_path = checkpoint_callback.best_model_path
model = MyModel.load_from_checkpoint(best_model_path)
```

### Reproducibility

```python
import lightning as L

# Set seed for reproducibility
L.seed_everything(42, workers=True)

trainer = L.Trainer(
    deterministic=True,  # Use deterministic algorithms
    max_epochs=10
)
```

### Efficient Data Loading

```python
class EfficientDataModule(L.LightningDataModule):
    def train_dataloader(self):
        return DataLoader(
            self.train_dataset,
            batch_size=self.batch_size,
            shuffle=True,
            num_workers=4,          # Use multiple workers
            pin_memory=True,        # Faster GPU transfer
            persistent_workers=True, # Keep workers alive between epochs
            prefetch_factor=2,      # Prefetch batches
        )
```

---

## Complete Example

A complete example putting everything together:

```python
import lightning as L
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, random_split
from torchvision import datasets, transforms
from torchmetrics import Accuracy
from lightning.pytorch.callbacks import ModelCheckpoint, EarlyStopping, LearningRateMonitor
from lightning.pytorch.loggers import TensorBoardLogger

# Define the DataModule
class CIFAR10DataModule(L.LightningDataModule):
    def __init__(self, data_dir='./', batch_size=64, num_workers=4):
        super().__init__()
        self.save_hyperparameters()

        self.train_transform = transforms.Compose([
            transforms.RandomCrop(32, padding=4),
            transforms.RandomHorizontalFlip(),
            transforms.ToTensor(),
            transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2470, 0.2435, 0.2616))
        ])

        self.val_transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize((0.4914, 0.4822, 0.4465), (0.2470, 0.2435, 0.2616))
        ])

    def prepare_data(self):
        datasets.CIFAR10(self.hparams.data_dir, train=True, download=True)
        datasets.CIFAR10(self.hparams.data_dir, train=False, download=True)

    def setup(self, stage=None):
        if stage == 'fit' or stage is None:
            cifar_full = datasets.CIFAR10(
                self.hparams.data_dir, train=True, transform=self.train_transform
            )
            self.cifar_train, self.cifar_val = random_split(cifar_full, [45000, 5000])
            # Apply val transform to validation set
            self.cifar_val.dataset.transform = self.val_transform

        if stage == 'test' or stage is None:
            self.cifar_test = datasets.CIFAR10(
                self.hparams.data_dir, train=False, transform=self.val_transform
            )

    def train_dataloader(self):
        return DataLoader(
            self.cifar_train, batch_size=self.hparams.batch_size,
            shuffle=True, num_workers=self.hparams.num_workers, pin_memory=True
        )

    def val_dataloader(self):
        return DataLoader(
            self.cifar_val, batch_size=self.hparams.batch_size,
            num_workers=self.hparams.num_workers, pin_memory=True
        )

    def test_dataloader(self):
        return DataLoader(
            self.cifar_test, batch_size=self.hparams.batch_size,
            num_workers=self.hparams.num_workers, pin_memory=True
        )

# Define the Model
class CIFAR10Classifier(L.LightningModule):
    def __init__(self, num_classes=10, lr=1e-3, weight_decay=1e-4):
        super().__init__()
        self.save_hyperparameters()

        # Simple CNN architecture
        self.features = nn.Sequential(
            nn.Conv2d(3, 64, 3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 64, 3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            nn.Dropout(0.25),

            nn.Conv2d(64, 128, 3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.Conv2d(128, 128, 3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            nn.Dropout(0.25),
        )

        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(128 * 8 * 8, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.5),
            nn.Linear(512, num_classes)
        )

        # Metrics
        self.train_acc = Accuracy(task='multiclass', num_classes=num_classes)
        self.val_acc = Accuracy(task='multiclass', num_classes=num_classes)
        self.test_acc = Accuracy(task='multiclass', num_classes=num_classes)

    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x

    def training_step(self, batch, batch_idx):
        x, y = batch
        logits = self(x)
        loss = F.cross_entropy(logits, y)

        self.train_acc(logits, y)
        self.log('train_loss', loss, on_step=True, on_epoch=True, prog_bar=True)
        self.log('train_acc', self.train_acc, on_step=False, on_epoch=True, prog_bar=True)

        return loss

    def validation_step(self, batch, batch_idx):
        x, y = batch
        logits = self(x)
        loss = F.cross_entropy(logits, y)

        self.val_acc(logits, y)
        self.log('val_loss', loss, prog_bar=True)
        self.log('val_acc', self.val_acc, prog_bar=True)

    def test_step(self, batch, batch_idx):
        x, y = batch
        logits = self(x)
        loss = F.cross_entropy(logits, y)

        self.test_acc(logits, y)
        self.log('test_loss', loss)
        self.log('test_acc', self.test_acc)

    def configure_optimizers(self):
        optimizer = torch.optim.AdamW(
            self.parameters(),
            lr=self.hparams.lr,
            weight_decay=self.hparams.weight_decay
        )
        scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(
            optimizer,
            T_max=self.trainer.max_epochs,
            eta_min=1e-6
        )
        return {
            'optimizer': optimizer,
            'lr_scheduler': {
                'scheduler': scheduler,
                'interval': 'epoch'
            }
        }

# Main training script
def main():
    # Set seed for reproducibility
    L.seed_everything(42, workers=True)

    # Initialize data module and model
    datamodule = CIFAR10DataModule(batch_size=128, num_workers=4)
    model = CIFAR10Classifier(lr=1e-3, weight_decay=1e-4)

    # Configure callbacks
    callbacks = [
        ModelCheckpoint(
            dirpath='checkpoints/',
            filename='{epoch}-{val_acc:.3f}',
            monitor='val_acc',
            mode='max',
            save_top_k=3,
            save_last=True
        ),
        EarlyStopping(
            monitor='val_loss',
            patience=10,
            mode='min'
        ),
        LearningRateMonitor(logging_interval='epoch')
    ]

    # Configure logger
    logger = TensorBoardLogger('logs/', name='cifar10')

    # Initialize trainer
    trainer = L.Trainer(
        max_epochs=100,
        accelerator='auto',
        devices='auto',
        precision='16-mixed',
        callbacks=callbacks,
        logger=logger,
        deterministic=True
    )

    # Train the model
    trainer.fit(model, datamodule)

    # Test the model
    trainer.test(model, datamodule, ckpt_path='best')

if __name__ == '__main__':
    main()
```

---

## Summary

PyTorch Lightning provides a structured approach to organizing PyTorch code that:

1. **Separates concerns**: Research code stays in `LightningModule`, engineering handled by `Trainer`
2. **Reduces boilerplate**: No manual device management, gradient handling, or training loops
3. **Enables scalability**: Multi-GPU and distributed training with minimal code changes
4. **Improves reproducibility**: Standardized structure and built-in seed management
5. **Integrates logging**: Native support for TensorBoard, W&B, and other loggers
6. **Provides flexibility**: Full access to underlying PyTorch when needed

By following Lightning best practices, you can write cleaner, more maintainable deep learning code that scales from a single GPU to large distributed clusters with minimal modifications.
