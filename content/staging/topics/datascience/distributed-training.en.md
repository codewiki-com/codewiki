---
title: "Distributed Training: Scaling Deep Learning Across GPUs and Nodes"
description: Master distributed training strategies including Data Parallelism, Model Parallelism, Pipeline Parallelism, DeepSpeed, and FSDP for training large-scale models
track: datascience
section: deployment
difficulty: advanced
tags:
  - distributed training
  - data parallel
  - model parallel
  - DeepSpeed
  - FSDP
  - PyTorch
status: imported
origin: old/src/content/docs/datascience/distributed-training.en.md
divergence: 0.292
issues:
  - order-mismatch
legacy:
  category: DataScience
  subcategory: MLSystems
  order: 25
  lastUpdated: 2026-01-07
---

As deep learning models grow larger and datasets expand, single-GPU training becomes impractical or impossible. Distributed training enables scaling model training across multiple GPUs and nodes, reducing training time from weeks to hours and enabling the training of models that exceed single-GPU memory capacity.

This comprehensive guide covers the fundamental concepts, practical implementations, and advanced techniques for distributed deep learning training.

---

## Introduction to Distributed Training

### Why Distributed Training?

The need for distributed training arises from several fundamental challenges:

1. **Model Size**: Modern models like GPT-4, Llama, and PaLM have billions to trillions of parameters that cannot fit in a single GPU memory
2. **Training Time**: Training large models on a single GPU can take months or years
3. **Dataset Scale**: Large datasets require parallel processing for practical training times
4. **Memory Constraints**: Activations, gradients, and optimizer states consume significant memory

### Types of Parallelism

```
+------------------+------------------------------------------+
|     Strategy     |           What is Parallelized           |
+------------------+------------------------------------------+
| Data Parallel    | Data batches across replicated models    |
| Model Parallel   | Model layers/tensors across devices      |
| Pipeline Parallel| Model stages processed in sequence       |
| Tensor Parallel  | Individual tensor operations split       |
+------------------+------------------------------------------+
```

### Memory Breakdown in Training

Understanding memory consumption is crucial for choosing the right strategy:

```python
def estimate_training_memory(model_params_billions, batch_size, seq_len,
                            hidden_dim, num_layers, precision='fp16'):
    """
    Estimate GPU memory required for training.

    Memory = Model + Optimizer + Gradients + Activations
    """
    bytes_per_param = 2 if precision == 'fp16' else 4

    # Model parameters
    model_memory_gb = model_params_billions * bytes_per_param

    # Gradients (same size as model in most cases)
    gradient_memory_gb = model_memory_gb

    # Optimizer states (Adam: 2x model size for momentum and variance)
    # Note: Optimizer states are typically kept in FP32
    optimizer_memory_gb = model_params_billions * 4 * 2  # FP32, 2 states

    # Activations (rough estimate, varies by architecture)
    # For transformers: ~2 * batch_size * seq_len * hidden_dim * num_layers * bytes
    activation_memory_gb = (2 * batch_size * seq_len * hidden_dim *
                           num_layers * bytes_per_param) / (1024**3)

    total_memory_gb = (model_memory_gb + gradient_memory_gb +
                      optimizer_memory_gb + activation_memory_gb)

    return {
        'model': model_memory_gb,
        'gradients': gradient_memory_gb,
        'optimizer': optimizer_memory_gb,
        'activations': activation_memory_gb,
        'total': total_memory_gb
    }

# Example: 7B parameter model
memory = estimate_training_memory(
    model_params_billions=7,
    batch_size=4,
    seq_len=2048,
    hidden_dim=4096,
    num_layers=32
)
print(f"Estimated total memory: {memory['total']:.1f} GB")
# Model: 14 GB, Gradients: 14 GB, Optimizer: 56 GB, Activations: ~2 GB
# Total: ~86 GB (exceeds single 80GB A100!)
```

---

## Data Parallelism

Data Parallelism (DP) is the most common distributed training strategy. It replicates the model across multiple GPUs and splits the data batch among them.

### How Data Parallelism Works

```
                        Mini-batch
                            |
            +-------+-------+-------+-------+
            |       |       |       |       |
           GPU0   GPU1    GPU2    GPU3
         (Model) (Model) (Model) (Model)
            |       |       |       |
        Forward  Forward Forward Forward
            |       |       |       |
        Backward Backward Backward Backward
            |       |       |       |
            +-------+-------+-------+-------+
                            |
                    AllReduce Gradients
                            |
                    Update All Models
```

### PyTorch DataParallel (DP) - Not Recommended

The simplest but least efficient approach:

```python
import torch
import torch.nn as nn

# Simple DataParallel (NOT recommended for production)
model = MyModel()
if torch.cuda.device_count() > 1:
    print(f"Using {torch.cuda.device_count()} GPUs with DataParallel")
    model = nn.DataParallel(model)
model = model.cuda()

# Issues with DataParallel:
# Python GIL bottleneck
# GPU 0 receives more memory load (output gathering)
# Only single-node training
# Inefficient communication patterns
```

### Distributed Data Parallel (DDP) - Recommended

DDP is the recommended approach for data-parallel training:

```python
import os
import torch
import torch.nn as nn
import torch.distributed as dist
import torch.multiprocessing as mp
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.utils.data import DataLoader, DistributedSampler

def setup(rank, world_size):
    """Initialize distributed process group."""
    os.environ['MASTER_ADDR'] = 'localhost'
    os.environ['MASTER_PORT'] = '12355'

    # Initialize process group
    # backend options: 'nccl' (GPU, recommended), 'gloo' (CPU/GPU), 'mpi'
    dist.init_process_group(
        backend='nccl',
        init_method='env://',
        world_size=world_size,
        rank=rank
    )

    # Set device for this process
    torch.cuda.set_device(rank)

def cleanup():
    """Clean up distributed process group."""
    dist.destroy_process_group()

class SimpleModel(nn.Module):
    def __init__(self, input_dim, hidden_dim, output_dim):
        super().__init__()
        self.layers = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, output_dim)
        )

    def forward(self, x):
        return self.layers(x)

def train_ddp(rank, world_size, epochs=10):
    """
    Training function for each DDP process.

    Args:
        rank: Unique identifier for this process (0 to world_size-1)
        world_size: Total number of processes
        epochs: Number of training epochs
    """
    print(f"Running DDP on rank {rank}")
    setup(rank, world_size)

    # Create model and move to GPU
    model = SimpleModel(1024, 2048, 10).to(rank)

    # Wrap model with DDP
    # find_unused_parameters=True if some parameters are not used in forward
    ddp_model = DDP(model, device_ids=[rank], find_unused_parameters=False)

    # Create dummy dataset
    dataset = torch.utils.data.TensorDataset(
        torch.randn(10000, 1024),
        torch.randint(0, 10, (10000,))
    )

    # IMPORTANT: Use DistributedSampler for proper data splitting
    sampler = DistributedSampler(
        dataset,
        num_replicas=world_size,
        rank=rank,
        shuffle=True,
        drop_last=True  # Important for even batch distribution
    )

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
        # CRITICAL: Set epoch for sampler to ensure different shuffling each epoch
        sampler.set_epoch(epoch)

        ddp_model.train()
        epoch_loss = 0.0

        for batch_idx, (data, target) in enumerate(dataloader):
            data, target = data.to(rank), target.to(rank)

            optimizer.zero_grad()
            output = ddp_model(data)
            loss = criterion(output, target)
            loss.backward()

            # Gradients are automatically synchronized by DDP
            optimizer.step()

            epoch_loss += loss.item()

        # Synchronize and print from rank 0 only
        avg_loss = epoch_loss / len(dataloader)

        if rank == 0:
            print(f"Epoch {epoch+1}/{epochs}, Average Loss: {avg_loss:.4f}")

    # Save model from rank 0 only
    if rank == 0:
        # Access underlying model with .module
        torch.save(ddp_model.module.state_dict(), 'model_ddp.pt')

    cleanup()

def main():
    """Launch DDP training."""
    world_size = torch.cuda.device_count()
    print(f"Starting DDP training on {world_size} GPUs")

    # Spawn processes
    mp.spawn(
        train_ddp,
        args=(world_size,),
        nprocs=world_size,
        join=True
    )

if __name__ == '__main__':
    main()
```

### Launching DDP with torchrun

The recommended way to launch DDP training:

```bash
# Single node, multiple GPUs
torchrun --standalone --nproc_per_node=4 train.py

# Multiple nodes
# On node 0:
torchrun --nproc_per_node=4 --nnodes=2 --node_rank=0 \
         --master_addr="192.168.1.1" --master_port=29500 train.py

# On node 1:
torchrun --nproc_per_node=4 --nnodes=2 --node_rank=1 \
         --master_addr="192.168.1.1" --master_port=29500 train.py
```

```python
# train.py for torchrun
import os
import torch
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP

def main():
    # torchrun sets these environment variables automatically
    rank = int(os.environ['RANK'])
    local_rank = int(os.environ['LOCAL_RANK'])
    world_size = int(os.environ['WORLD_SIZE'])

    # Initialize process group
    dist.init_process_group(backend='nccl')
    torch.cuda.set_device(local_rank)

    # Create and wrap model
    model = MyModel().to(local_rank)
    model = DDP(model, device_ids=[local_rank])

    # Training code...

    dist.destroy_process_group()

if __name__ == '__main__':
    main()
```

### DDP with Automatic Mixed Precision (AMP)

Combining DDP with AMP for faster training:

```python
from torch.cuda.amp import autocast, GradScaler

def train_ddp_amp(rank, world_size):
    setup(rank, world_size)

    model = LargeModel().to(rank)
    ddp_model = DDP(model, device_ids=[rank])

    optimizer = torch.optim.AdamW(ddp_model.parameters(), lr=1e-4)
    scaler = GradScaler()
    criterion = nn.CrossEntropyLoss()

    for epoch in range(epochs):
        sampler.set_epoch(epoch)

        for data, target in dataloader:
            data, target = data.to(rank), target.to(rank)

            optimizer.zero_grad()

            # Forward pass with autocast
            with autocast():
                output = ddp_model(data)
                loss = criterion(output, target)

            # Backward pass with scaled gradients
            scaler.scale(loss).backward()

            # Unscale gradients for clipping
            scaler.unscale_(optimizer)
            torch.nn.utils.clip_grad_norm_(ddp_model.parameters(), max_norm=1.0)

            # Optimizer step
            scaler.step(optimizer)
            scaler.update()

    cleanup()
```

### Gradient Accumulation with DDP

When memory is limited, accumulate gradients over multiple forward passes:

```python
def train_with_gradient_accumulation(
    model, dataloader, optimizer, criterion,
    accumulation_steps=4, rank=0
):
    """
    DDP training with gradient accumulation.

    Effective batch size = batch_size * accumulation_steps * world_size
    """
    model.train()
    optimizer.zero_grad()

    for batch_idx, (data, target) in enumerate(dataloader):
        data, target = data.to(rank), target.to(rank)

        # Use no_sync context to skip gradient synchronization
        # until we are ready to update
        if (batch_idx + 1) % accumulation_steps != 0:
            # Skip synchronization for intermediate steps
            with model.no_sync():
                output = model(data)
                loss = criterion(output, target) / accumulation_steps
                loss.backward()
        else:
            # Synchronize on the last accumulation step
            output = model(data)
            loss = criterion(output, target) / accumulation_steps
            loss.backward()

            # Gradient clipping
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)

            # Update parameters
            optimizer.step()
            optimizer.zero_grad()
```

---

## Model Parallelism

Model Parallelism splits the model itself across multiple GPUs, essential when a single model is too large for one GPU.

### Types of Model Parallelism

1. **Layer-wise (Vertical) Parallelism**: Different layers on different GPUs
2. **Tensor (Horizontal) Parallelism**: Split individual tensors/operations across GPUs
3. **Pipeline Parallelism**: Process micro-batches through model stages

### Basic Layer-wise Model Parallelism

```python
import torch
import torch.nn as nn

class ModelParallel(nn.Module):
    """
    Simple model parallelism: split layers across GPUs.

    Pros: Simple implementation
    Cons: GPU idle time (one GPU active at a time)
    """

    def __init__(self):
        super().__init__()

        # First half of model on GPU 0
        self.block1 = nn.Sequential(
            nn.Linear(4096, 8192),
            nn.GELU(),
            nn.Linear(8192, 8192),
            nn.GELU(),
        ).to('cuda:0')

        # Second half on GPU 1
        self.block2 = nn.Sequential(
            nn.Linear(8192, 8192),
            nn.GELU(),
            nn.Linear(8192, 4096),
            nn.GELU(),
        ).to('cuda:1')

        # Output layer on GPU 1
        self.output = nn.Linear(4096, 1000).to('cuda:1')

    def forward(self, x):
        # Forward through first block on GPU 0
        x = self.block1(x.to('cuda:0'))

        # Transfer to GPU 1 and forward through second block
        x = self.block2(x.to('cuda:1'))

        # Output on GPU 1
        return self.output(x)


class ImprovedModelParallel(nn.Module):
    """
    Model parallelism with overlapped computation using CUDA streams.

    Reduces GPU idle time by overlapping data transfer with computation.
    """

    def __init__(self):
        super().__init__()

        self.block1 = nn.Sequential(
            nn.Linear(4096, 8192),
            nn.GELU(),
        ).to('cuda:0')

        self.block2 = nn.Sequential(
            nn.Linear(8192, 8192),
            nn.GELU(),
        ).to('cuda:1')

        self.output = nn.Linear(8192, 1000).to('cuda:1')

        # CUDA streams for overlapping
        self.stream1 = torch.cuda.Stream(device='cuda:0')
        self.stream2 = torch.cuda.Stream(device='cuda:1')

    def forward(self, x):
        # Split input into chunks for pipelining
        chunks = x.split(x.size(0) // 2)

        outputs = []

        for i, chunk in enumerate(chunks):
            with torch.cuda.stream(self.stream1):
                out1 = self.block1(chunk.to('cuda:0'))

            # Wait for block1 to finish before starting block2
            self.stream2.wait_stream(self.stream1)

            with torch.cuda.stream(self.stream2):
                out2 = self.block2(out1.to('cuda:1'))
                outputs.append(self.output(out2))

        torch.cuda.synchronize()
        return torch.cat(outputs, dim=0)


# Training with model parallelism
def train_model_parallel():
    model = ModelParallel()

    # Note: Optimizer needs parameters from multiple devices
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4)
    criterion = nn.CrossEntropyLoss()

    for data, target in dataloader:
        optimizer.zero_grad()

        # Input starts on CPU, will be moved in forward()
        # Labels must be on the same device as output (GPU 1)
        output = model(data)
        loss = criterion(output, target.to('cuda:1'))

        loss.backward()
        optimizer.step()
```

### Automatic Model Parallelism with device_map

For Hugging Face models:

```python
from transformers import AutoModelForCausalLM, AutoTokenizer

# Automatically distribute model across available GPUs
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-2-7b-hf",
    device_map="auto",  # Automatically distribute layers
    torch_dtype=torch.float16
)

# Or specify custom device mapping
device_map = {
    "model.embed_tokens": 0,
    "model.layers.0": 0,
    "model.layers.1": 0,
    # ... layers 2-15 on GPU 0
    "model.layers.16": 1,
    "model.layers.17": 1,
    # ... layers 16-31 on GPU 1
    "model.norm": 1,
    "lm_head": 1
}

model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-2-7b-hf",
    device_map=device_map,
    torch_dtype=torch.float16
)
```

---

## Pipeline Parallelism

Pipeline Parallelism divides the model into stages and processes micro-batches in a pipelined fashion, improving GPU utilization over naive model parallelism.

### Pipeline Parallelism Concepts

```
Traditional Model Parallel (Sequential):
Time ->
GPU 0: [----F----][----B----][    idle    ]
GPU 1: [  idle   ][----F----][----B----]

Pipeline Parallel (GPipe style):
Time ->
GPU 0: [F0][F1][F2][F3][B3][B2][B1][B0]
GPU 1:    [F0][F1][F2][B2][B1][B0][B3]

F = Forward, B = Backward, numbers = micro-batch index
```

### Pipeline Parallel with PyTorch

```python
import torch
import torch.nn as nn
from torch.distributed.pipeline.sync import Pipe

class TransformerStage(nn.Module):
    """A stage of a transformer model for pipeline parallelism."""

    def __init__(self, hidden_dim, num_heads, num_layers):
        super().__init__()
        self.layers = nn.ModuleList([
            nn.TransformerEncoderLayer(
                d_model=hidden_dim,
                nhead=num_heads,
                dim_feedforward=hidden_dim * 4,
                batch_first=True
            )
            for _ in range(num_layers)
        ])

    def forward(self, x):
        for layer in self.layers:
            x = layer(x)
        return x


def create_pipeline_model(num_stages=4, layers_per_stage=8):
    """
    Create a pipeline-parallel model.

    Args:
        num_stages: Number of pipeline stages (typically = number of GPUs)
        layers_per_stage: Number of transformer layers per stage
    """
    hidden_dim = 1024
    num_heads = 16

    # Create stages
    stages = []

    # Embedding stage
    embedding = nn.Sequential(
        nn.Embedding(50000, hidden_dim),
        nn.Dropout(0.1)
    ).to(f'cuda:0')
    stages.append(embedding)

    # Transformer stages
    for i in range(num_stages):
        stage = TransformerStage(
            hidden_dim=hidden_dim,
            num_heads=num_heads,
            num_layers=layers_per_stage
        ).to(f'cuda:{i}')
        stages.append(stage)

    # Output stage
    output = nn.Sequential(
        nn.LayerNorm(hidden_dim),
        nn.Linear(hidden_dim, 50000)
    ).to(f'cuda:{num_stages-1}')
    stages.append(output)

    # Combine into sequential model
    model = nn.Sequential(*stages)

    # Wrap with Pipe
    # chunks: number of micro-batches (higher = better GPU utilization, more memory)
    pipeline_model = Pipe(
        model,
        chunks=8,  # Split batch into 8 micro-batches
        checkpoint='except_last'  # Gradient checkpointing for memory efficiency
    )

    return pipeline_model


# Training with Pipeline Parallelism
def train_pipeline():
    model = create_pipeline_model(num_stages=4)

    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4)
    criterion = nn.CrossEntropyLoss()

    for input_ids, labels in dataloader:
        optimizer.zero_grad()

        # Input to first device
        input_ids = input_ids.to('cuda:0')
        # Labels to last device (where output is)
        labels = labels.to(f'cuda:{torch.cuda.device_count()-1}')

        # Forward pass (handles micro-batch pipelining internally)
        output = model(input_ids)

        # RRef handling for pipeline outputs
        if hasattr(output, 'local_value'):
            output = output.local_value()

        loss = criterion(output.view(-1, output.size(-1)), labels.view(-1))
        loss.backward()

        optimizer.step()
```

### Custom GPipe Implementation

```python
class GPipeScheduler:
    """
    GPipe-style pipeline scheduler.

    Implements 1F1B (one forward, one backward) schedule for efficiency.
    """

    def __init__(self, stages, num_microbatches=8):
        """
        Args:
            stages: List of nn.Module, each on a different GPU
            num_microbatches: Number of micro-batches to split batch into
        """
        self.stages = stages
        self.num_stages = len(stages)
        self.num_microbatches = num_microbatches

    def forward(self, inputs):
        """
        Execute forward pass with pipeline schedule.

        Returns activations for backward pass.
        """
        microbatch_size = inputs.size(0) // self.num_microbatches
        microbatches = inputs.split(microbatch_size)

        # Storage for activations (needed for backward)
        all_activations = [[None] * self.num_microbatches
                          for _ in range(self.num_stages)]
        outputs = []

        # Forward pass through all stages
        for mb_idx, mb in enumerate(microbatches):
            x = mb
            for stage_idx, stage in enumerate(self.stages):
                device = next(stage.parameters()).device
                x = x.to(device)

                # Store activation for backward
                all_activations[stage_idx][mb_idx] = x.clone()

                # Forward through stage
                x = stage(x)

            outputs.append(x)

        return torch.cat(outputs, dim=0), all_activations

    def backward(self, grad_output, all_activations):
        """
        Execute backward pass with pipeline schedule.
        """
        microbatch_size = grad_output.size(0) // self.num_microbatches
        grad_microbatches = grad_output.split(microbatch_size)

        # Backward pass (reverse order)
        for mb_idx in reversed(range(self.num_microbatches)):
            grad = grad_microbatches[mb_idx]

            for stage_idx in reversed(range(self.num_stages)):
                stage = self.stages[stage_idx]
                activation = all_activations[stage_idx][mb_idx]

                # Enable gradient computation for this activation
                activation.requires_grad_(True)

                # Recompute forward (for gradient checkpointing)
                device = next(stage.parameters()).device
                output = stage(activation.to(device))

                # Backward
                output.backward(grad.to(device))

                # Get gradient for next stage
                grad = activation.grad


class OneFOneBScheduler:
    """
    1F1B (One Forward, One Backward) Pipeline Scheduler.

    More memory-efficient than GPipe as it interleaves forward and backward.
    """

    def __init__(self, stages, num_microbatches):
        self.stages = stages
        self.num_stages = len(stages)
        self.num_microbatches = num_microbatches

    def step(self, inputs, labels, criterion):
        """
        Execute 1F1B schedule.

        Schedule:
        1. Warmup: Fill pipeline with forwards
        2. Steady state: Alternate 1 forward, 1 backward
        3. Cooldown: Drain pipeline with backwards
        """
        microbatch_size = inputs.size(0) // self.num_microbatches
        input_mbs = inputs.split(microbatch_size)
        label_mbs = labels.split(microbatch_size)

        # Activation storage (only keep what is needed)
        activations = {}
        losses = []

        # Phase 1: Warmup (fill pipeline)
        for mb_idx in range(min(self.num_stages, self.num_microbatches)):
            x = input_mbs[mb_idx]
            for stage_idx, stage in enumerate(self.stages):
                device = next(stage.parameters()).device
                x = x.to(device)

                # Save activation
                activations[(stage_idx, mb_idx)] = x.detach().requires_grad_(True)
                x = stage(activations[(stage_idx, mb_idx)])

            # Compute loss for this microbatch
            loss = criterion(x, label_mbs[mb_idx].to(x.device))
            losses.append(loss)

        # Phase 2: Steady state (1F1B)
        for mb_idx in range(self.num_stages, self.num_microbatches):
            # Forward for new microbatch
            x = input_mbs[mb_idx]
            for stage_idx, stage in enumerate(self.stages):
                device = next(stage.parameters()).device
                x = x.to(device)
                activations[(stage_idx, mb_idx)] = x.detach().requires_grad_(True)
                x = stage(activations[(stage_idx, mb_idx)])

            loss = criterion(x, label_mbs[mb_idx].to(x.device))
            losses.append(loss)

            # Backward for earlier microbatch
            backward_mb_idx = mb_idx - self.num_stages
            losses[backward_mb_idx].backward()

            # Clean up activations
            for stage_idx in range(self.num_stages):
                del activations[(stage_idx, backward_mb_idx)]

        # Phase 3: Cooldown (drain pipeline)
        for mb_idx in range(self.num_microbatches - self.num_stages,
                          self.num_microbatches):
            losses[mb_idx].backward()

        return sum(l.item() for l in losses) / len(losses)
```

---

## Tensor Parallelism

Tensor Parallelism splits individual tensor operations (like matrix multiplications) across GPUs, enabling very large layers.

### Megatron-LM Style Tensor Parallelism

```python
import torch
import torch.nn as nn
import torch.distributed as dist

class ColumnParallelLinear(nn.Module):
    """
    Linear layer with column parallelism.

    Splits weight matrix along output dimension:
    Y = XW where W is split into [W1, W2, ..., Wn] column-wise
    Each GPU computes Y_i = X @ W_i
    """

    def __init__(self, in_features, out_features, world_size, rank,
                 gather_output=True):
        super().__init__()
        self.world_size = world_size
        self.rank = rank
        self.gather_output = gather_output

        # Each GPU handles out_features // world_size columns
        self.out_features_per_partition = out_features // world_size

        self.weight = nn.Parameter(
            torch.empty(self.out_features_per_partition, in_features)
        )
        self.bias = nn.Parameter(
            torch.empty(self.out_features_per_partition)
        )

        # Initialize
        nn.init.kaiming_uniform_(self.weight)
        nn.init.zeros_(self.bias)

    def forward(self, x):
        # Each GPU computes its portion: x @ W_i
        local_output = nn.functional.linear(x, self.weight, self.bias)

        if self.gather_output:
            # Gather outputs from all GPUs
            output_list = [torch.zeros_like(local_output)
                          for _ in range(self.world_size)]
            dist.all_gather(output_list, local_output)
            return torch.cat(output_list, dim=-1)
        else:
            # Keep distributed for next layer
            return local_output


class RowParallelLinear(nn.Module):
    """
    Linear layer with row parallelism.

    Splits weight matrix along input dimension:
    Y = XW where W is split into [W1; W2; ...; Wn] row-wise
    Each GPU has portion of input, computes partial output, then reduces
    """

    def __init__(self, in_features, out_features, world_size, rank,
                 input_is_parallel=True):
        super().__init__()
        self.world_size = world_size
        self.rank = rank
        self.input_is_parallel = input_is_parallel

        # Each GPU handles in_features // world_size rows
        self.in_features_per_partition = in_features // world_size

        self.weight = nn.Parameter(
            torch.empty(out_features, self.in_features_per_partition)
        )
        # Only rank 0 has bias (since we sum outputs)
        if rank == 0:
            self.bias = nn.Parameter(torch.empty(out_features))
        else:
            self.register_parameter('bias', None)

        # Initialize
        nn.init.kaiming_uniform_(self.weight)
        if self.bias is not None:
            nn.init.zeros_(self.bias)

    def forward(self, x):
        if not self.input_is_parallel:
            # Split input along last dimension
            x = x.chunk(self.world_size, dim=-1)[self.rank]

        # Each GPU computes partial output
        local_output = nn.functional.linear(x, self.weight)

        # Sum partial outputs across GPUs
        dist.all_reduce(local_output, op=dist.ReduceOp.SUM)

        # Add bias (only on rank 0 but broadcast through all_reduce)
        if self.bias is not None:
            local_output = local_output + self.bias

        return local_output


class TensorParallelMLP(nn.Module):
    """
    Tensor-parallel MLP (used in transformers).

    Uses column parallelism for first linear, row parallelism for second.
    This minimizes communication by keeping intermediate activations distributed.

    Architecture:
    Input -> ColumnParallel(no gather) -> GeLU -> RowParallel -> Output
    """

    def __init__(self, hidden_dim, intermediate_dim, world_size, rank):
        super().__init__()

        # First linear: split output columns, no gather
        self.fc1 = ColumnParallelLinear(
            hidden_dim, intermediate_dim, world_size, rank,
            gather_output=False  # Keep distributed
        )

        # Second linear: split input rows (receives distributed input)
        self.fc2 = RowParallelLinear(
            intermediate_dim, hidden_dim, world_size, rank,
            input_is_parallel=True
        )

        self.activation = nn.GELU()

    def forward(self, x):
        # Column parallel: each GPU has portion of intermediate
        x = self.fc1(x)
        x = self.activation(x)
        # Row parallel: reduces to full output
        x = self.fc2(x)
        return x


class TensorParallelAttention(nn.Module):
    """
    Tensor-parallel multi-head attention.

    Splits attention heads across GPUs.
    Each GPU handles num_heads // world_size heads.
    """

    def __init__(self, hidden_dim, num_heads, world_size, rank):
        super().__init__()
        self.hidden_dim = hidden_dim
        self.num_heads = num_heads
        self.world_size = world_size
        self.rank = rank

        self.heads_per_gpu = num_heads // world_size
        self.head_dim = hidden_dim // num_heads

        # QKV projection: column parallel
        self.qkv = ColumnParallelLinear(
            hidden_dim,
            3 * self.heads_per_gpu * self.head_dim,
            world_size, rank,
            gather_output=False
        )

        # Output projection: row parallel
        self.out_proj = RowParallelLinear(
            self.heads_per_gpu * self.head_dim,
            hidden_dim,
            world_size, rank,
            input_is_parallel=True
        )

    def forward(self, x):
        batch_size, seq_len, _ = x.shape

        # QKV projection (distributed)
        qkv = self.qkv(x)
        qkv = qkv.view(batch_size, seq_len, 3, self.heads_per_gpu, self.head_dim)
        q, k, v = qkv.unbind(dim=2)

        # Reshape for attention
        q = q.transpose(1, 2)  # (batch, heads, seq, head_dim)
        k = k.transpose(1, 2)
        v = v.transpose(1, 2)

        # Scaled dot-product attention
        scale = self.head_dim ** -0.5
        attn = torch.matmul(q, k.transpose(-2, -1)) * scale
        attn = torch.softmax(attn, dim=-1)
        out = torch.matmul(attn, v)

        # Reshape and project
        out = out.transpose(1, 2).contiguous()
        out = out.view(batch_size, seq_len, self.heads_per_gpu * self.head_dim)

        # Output projection with all-reduce
        return self.out_proj(out)
```

---

## DeepSpeed

DeepSpeed is Microsoft's distributed training library that provides highly optimized implementations of data parallelism, model parallelism, and memory optimization techniques.

### ZeRO (Zero Redundancy Optimizer)

ZeRO partitions optimizer states, gradients, and parameters across GPUs to reduce memory redundancy.

```
Memory per GPU comparison (training 7.5B model):

Traditional Data Parallel: 120 GB per GPU (needs special hardware)
ZeRO Stage 1: 31.4 GB (optimizer states partitioned)
ZeRO Stage 2: 16.6 GB (+ gradients partitioned)
ZeRO Stage 3: 1.9 GB  (+ parameters partitioned)
```

### DeepSpeed Configuration

```json
{
    "train_batch_size": 256,
    "train_micro_batch_size_per_gpu": 8,
    "gradient_accumulation_steps": 8,

    "optimizer": {
        "type": "AdamW",
        "params": {
            "lr": 1e-4,
            "betas": [0.9, 0.999],
            "eps": 1e-8,
            "weight_decay": 0.01
        }
    },

    "scheduler": {
        "type": "WarmupDecayLR",
        "params": {
            "warmup_min_lr": 0,
            "warmup_max_lr": 1e-4,
            "warmup_num_steps": 1000,
            "total_num_steps": 100000
        }
    },

    "fp16": {
        "enabled": true,
        "loss_scale": 0,
        "loss_scale_window": 1000,
        "initial_scale_power": 16,
        "hysteresis": 2,
        "min_loss_scale": 1
    },

    "zero_optimization": {
        "stage": 2,
        "offload_optimizer": {
            "device": "cpu",
            "pin_memory": true
        },
        "offload_param": {
            "device": "none"
        },
        "overlap_comm": true,
        "contiguous_gradients": true,
        "reduce_bucket_size": 5e8,
        "stage3_prefetch_bucket_size": 5e8,
        "stage3_param_persistence_threshold": 1e6
    },

    "gradient_clipping": 1.0,

    "activation_checkpointing": {
        "partition_activations": true,
        "contiguous_memory_optimization": true,
        "cpu_checkpointing": false
    }
}
```

### Training with DeepSpeed

```python
import torch
import deepspeed
from transformers import AutoModelForCausalLM, AutoTokenizer

def train_with_deepspeed():
    # Model and tokenizer
    model = AutoModelForCausalLM.from_pretrained("gpt2-large")
    tokenizer = AutoTokenizer.from_pretrained("gpt2-large")

    # DeepSpeed configuration
    ds_config = {
        "train_batch_size": 32,
        "train_micro_batch_size_per_gpu": 4,
        "gradient_accumulation_steps": 2,
        "fp16": {"enabled": True},
        "zero_optimization": {
            "stage": 2,
            "overlap_comm": True,
            "contiguous_gradients": True,
            "reduce_scatter": True
        },
        "gradient_clipping": 1.0,
        "steps_per_print": 100
    }

    # Initialize DeepSpeed
    model_engine, optimizer, _, _ = deepspeed.initialize(
        model=model,
        model_parameters=model.parameters(),
        config=ds_config
    )

    # Training loop
    for epoch in range(num_epochs):
        for batch in dataloader:
            input_ids = batch['input_ids'].to(model_engine.device)
            labels = batch['labels'].to(model_engine.device)

            # Forward pass
            outputs = model_engine(input_ids, labels=labels)
            loss = outputs.loss

            # Backward pass (DeepSpeed handles gradient accumulation)
            model_engine.backward(loss)

            # Optimizer step (DeepSpeed handles gradient sync)
            model_engine.step()

    # Save checkpoint
    model_engine.save_checkpoint('checkpoints/', tag='final')


# Launch with: deepspeed --num_gpus=8 train.py
```

### ZeRO Stage 3 with CPU Offloading

For very large models that exceed total GPU memory:

```python
import deepspeed
import torch

# ZeRO Stage 3 configuration with CPU offloading
ds_config = {
    "train_batch_size": 64,
    "train_micro_batch_size_per_gpu": 1,
    "gradient_accumulation_steps": 16,

    "bf16": {
        "enabled": True
    },

    "zero_optimization": {
        "stage": 3,

        # Offload optimizer states to CPU
        "offload_optimizer": {
            "device": "cpu",
            "pin_memory": True
        },

        # Offload parameters to CPU
        "offload_param": {
            "device": "cpu",
            "pin_memory": True
        },

        # Stage 3 specific settings
        "stage3_max_live_parameters": 1e9,
        "stage3_max_reuse_distance": 1e9,
        "stage3_prefetch_bucket_size": 1e7,
        "stage3_param_persistence_threshold": 1e5,

        "sub_group_size": 1e9,
        "reduce_bucket_size": "auto",
        "stage3_gather_16bit_weights_on_model_save": True
    },

    "activation_checkpointing": {
        "partition_activations": True,
        "cpu_checkpointing": True,
        "contiguous_memory_optimization": True,
        "number_checkpoints": 4
    }
}

# Initialize with ZeRO-3
model_engine, optimizer, _, _ = deepspeed.initialize(
    model=model,
    config=ds_config
)
```

### DeepSpeed ZeRO-Infinity

For training models that exceed combined GPU + CPU memory:

```python
# ZeRO-Infinity configuration (NVMe offloading)
ds_config = {
    "zero_optimization": {
        "stage": 3,

        "offload_optimizer": {
            "device": "nvme",
            "nvme_path": "/local_nvme",
            "pin_memory": True,
            "buffer_count": 4,
            "fast_init": False
        },

        "offload_param": {
            "device": "nvme",
            "nvme_path": "/local_nvme",
            "pin_memory": True,
            "buffer_count": 5,
            "buffer_size": 1e8
        },

        "aio": {
            "block_size": 1048576,
            "queue_depth": 8,
            "thread_count": 1,
            "single_submit": False,
            "overlap_events": True
        }
    }
}
```

### DeepSpeed Inference

```python
import deepspeed
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

# Load model
model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-2-7b-hf")
tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-2-7b-hf")

# Initialize DeepSpeed inference
ds_engine = deepspeed.init_inference(
    model=model,
    mp_size=4,  # Tensor parallelism across 4 GPUs
    dtype=torch.float16,
    replace_with_kernel_inject=True,
    max_out_tokens=2048
)

# Generate
inputs = tokenizer("Hello, my name is", return_tensors="pt")
inputs = {k: v.to(ds_engine.module.device) for k, v in inputs.items()}

with torch.no_grad():
    outputs = ds_engine.module.generate(
        **inputs,
        max_new_tokens=100,
        do_sample=True,
        temperature=0.7
    )

print(tokenizer.decode(outputs[0], skip_special_tokens=True))
```

---

## Fully Sharded Data Parallel (FSDP)

FSDP is PyTorch's native implementation of ZeRO-3 style training. It shards model parameters, gradients, and optimizer states across data parallel workers.

### FSDP Concepts

```
Standard DDP:                    FSDP:
GPU 0: Full Model               GPU 0: Model Shard 0
GPU 1: Full Model               GPU 1: Model Shard 1
GPU 2: Full Model               GPU 2: Model Shard 2
GPU 3: Full Model               GPU 3: Model Shard 3

                                On forward/backward:
                                All-gather -> Compute -> Reduce-scatter
```

### Basic FSDP Usage

```python
import torch
import torch.nn as nn
import torch.distributed as dist
from torch.distributed.fsdp import (
    FullyShardedDataParallel as FSDP,
    MixedPrecision,
    BackwardPrefetch,
    ShardingStrategy,
    CPUOffload
)
from torch.distributed.fsdp.wrap import (
    transformer_auto_wrap_policy,
    size_based_auto_wrap_policy,
    enable_wrap,
    wrap
)
import functools

def setup_fsdp(rank, world_size):
    """Initialize distributed environment for FSDP."""
    dist.init_process_group(
        backend='nccl',
        init_method='env://',
        world_size=world_size,
        rank=rank
    )
    torch.cuda.set_device(rank)

class TransformerBlock(nn.Module):
    """Transformer block for FSDP wrapping."""

    def __init__(self, hidden_dim, num_heads):
        super().__init__()
        self.attention = nn.MultiheadAttention(hidden_dim, num_heads, batch_first=True)
        self.mlp = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim * 4),
            nn.GELU(),
            nn.Linear(hidden_dim * 4, hidden_dim)
        )
        self.norm1 = nn.LayerNorm(hidden_dim)
        self.norm2 = nn.LayerNorm(hidden_dim)

    def forward(self, x):
        x = x + self.attention(self.norm1(x), self.norm1(x), self.norm1(x))[0]
        x = x + self.mlp(self.norm2(x))
        return x


class TransformerModel(nn.Module):
    """Full transformer model."""

    def __init__(self, vocab_size, hidden_dim, num_heads, num_layers):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, hidden_dim)
        self.layers = nn.ModuleList([
            TransformerBlock(hidden_dim, num_heads)
            for _ in range(num_layers)
        ])
        self.output = nn.Linear(hidden_dim, vocab_size)

    def forward(self, x):
        x = self.embedding(x)
        for layer in self.layers:
            x = layer(x)
        return self.output(x)


def train_with_fsdp(rank, world_size):
    """Training with FSDP."""
    setup_fsdp(rank, world_size)

    # Create model
    model = TransformerModel(
        vocab_size=50000,
        hidden_dim=2048,
        num_heads=16,
        num_layers=24
    )

    # Define wrapping policy
    # Wrap each TransformerBlock individually
    transformer_wrap_policy = functools.partial(
        transformer_auto_wrap_policy,
        transformer_layer_cls={TransformerBlock}
    )

    # Alternative: Size-based wrapping
    size_wrap_policy = functools.partial(
        size_based_auto_wrap_policy,
        min_num_params=100_000_000  # 100M parameters
    )

    # Mixed precision configuration
    mixed_precision = MixedPrecision(
        param_dtype=torch.float16,
        reduce_dtype=torch.float16,
        buffer_dtype=torch.float16
    )

    # For bfloat16 (Ampere+ GPUs):
    bf16_mixed_precision = MixedPrecision(
        param_dtype=torch.bfloat16,
        reduce_dtype=torch.bfloat16,
        buffer_dtype=torch.bfloat16
    )

    # Wrap model with FSDP
    model = FSDP(
        model,
        auto_wrap_policy=transformer_wrap_policy,
        mixed_precision=mixed_precision,
        sharding_strategy=ShardingStrategy.FULL_SHARD,  # ZeRO-3
        device_id=rank,
        backward_prefetch=BackwardPrefetch.BACKWARD_PRE,
        cpu_offload=None,  # or CPUOffload(offload_params=True)
        use_orig_params=True  # Better optimizer compatibility
    )

    # Optimizer (after FSDP wrapping)
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4)

    # Training loop
    model.train()
    for epoch in range(num_epochs):
        for batch_idx, (input_ids, labels) in enumerate(dataloader):
            input_ids = input_ids.to(rank)
            labels = labels.to(rank)

            optimizer.zero_grad()

            output = model(input_ids)
            loss = nn.functional.cross_entropy(
                output.view(-1, output.size(-1)),
                labels.view(-1)
            )

            loss.backward()
            optimizer.step()

            if rank == 0 and batch_idx % 100 == 0:
                print(f"Epoch {epoch}, Batch {batch_idx}, Loss: {loss.item():.4f}")

    # Save model
    save_fsdp_model(model, rank, "model_fsdp.pt")

    dist.destroy_process_group()


def save_fsdp_model(model, rank, path):
    """Save FSDP model checkpoint."""
    from torch.distributed.fsdp import (
        FullStateDictConfig,
        StateDictType,
        FullOptimStateDictConfig
    )

    # Configure state dict gathering
    save_policy = FullStateDictConfig(offload_to_cpu=True, rank0_only=True)

    with FSDP.state_dict_type(model, StateDictType.FULL_STATE_DICT, save_policy):
        state_dict = model.state_dict()

        if rank == 0:
            torch.save(state_dict, path)
            print(f"Model saved to {path}")


def load_fsdp_model(model, rank, path):
    """Load FSDP model checkpoint."""
    from torch.distributed.fsdp import StateDictType

    # Load on rank 0 and broadcast
    if rank == 0:
        state_dict = torch.load(path)
    else:
        state_dict = None

    # Scatter state dict to all ranks
    with FSDP.state_dict_type(model, StateDictType.FULL_STATE_DICT):
        model.load_state_dict(state_dict)
```

### FSDP Sharding Strategies

```python
from torch.distributed.fsdp import ShardingStrategy

# FULL_SHARD (ZeRO-3): Maximum memory savings
# Shards parameters, gradients, and optimizer states
model = FSDP(model, sharding_strategy=ShardingStrategy.FULL_SHARD)

# SHARD_GRAD_OP (ZeRO-2): Moderate memory savings, faster
# Shards gradients and optimizer states, not parameters
model = FSDP(model, sharding_strategy=ShardingStrategy.SHARD_GRAD_OP)

# NO_SHARD (DDP equivalent): For comparison
# No sharding, like regular DDP
model = FSDP(model, sharding_strategy=ShardingStrategy.NO_SHARD)

# HYBRID_SHARD: Shard within node, replicate across nodes
# Best for multi-node with fast intra-node communication
model = FSDP(model, sharding_strategy=ShardingStrategy.HYBRID_SHARD)

# _HYBRID_SHARD_ZERO2: HYBRID_SHARD with ZeRO-2
model = FSDP(model, sharding_strategy=ShardingStrategy._HYBRID_SHARD_ZERO2)
```

### FSDP with CPU Offloading

For models that exceed GPU memory even with sharding:

```python
from torch.distributed.fsdp import CPUOffload

# Offload parameters to CPU (trade compute for memory)
model = FSDP(
    model,
    auto_wrap_policy=transformer_wrap_policy,
    sharding_strategy=ShardingStrategy.FULL_SHARD,
    cpu_offload=CPUOffload(offload_params=True),
    device_id=rank
)

# Note: CPU offloading significantly slows training
# Use only when necessary for memory
```

### FSDP with Activation Checkpointing

Reduce activation memory by recomputing during backward:

```python
from torch.distributed.algorithms._checkpoint.checkpoint_wrapper import (
    checkpoint_wrapper,
    CheckpointImpl,
    apply_activation_checkpointing
)

# Apply checkpointing to transformer blocks
check_fn = lambda submodule: isinstance(submodule, TransformerBlock)

apply_activation_checkpointing(
    model,
    checkpoint_wrapper_fn=checkpoint_wrapper,
    check_fn=check_fn
)

# Then wrap with FSDP
model = FSDP(model, ...)
```

### Comparison: DeepSpeed ZeRO vs FSDP

| Feature | DeepSpeed ZeRO | PyTorch FSDP |
|---------|----------------|--------------|
| Integration | Separate library | Native PyTorch |
| ZeRO Stages | 1, 2, 3, Infinity | Similar to ZeRO-2/3 |
| CPU Offloading | Yes + NVMe | CPU only |
| Tensor Parallelism | Built-in | Separate (TP) |
| Optimizers | Custom optimized | Standard PyTorch |
| Ecosystem | HuggingFace, etc. | Native |
| Debugging | More complex | Easier (native) |

---

## Hybrid Parallelism Strategies

For very large models, combining multiple parallelism strategies is essential.

### 3D Parallelism

Combining Data, Tensor, and Pipeline Parallelism:

```
3D Parallelism Layout (64 GPUs):
- Data Parallel: 4 replicas
- Tensor Parallel: 4-way (within node)
- Pipeline Parallel: 4 stages

         Node 0          Node 1          Node 2          Node 3
        (Stage 0)       (Stage 1)       (Stage 2)       (Stage 3)
       +---------+     +---------+     +---------+     +---------+
DP 0   | TP 0-3  |---->| TP 0-3  |---->| TP 0-3  |---->| TP 0-3  |
       +---------+     +---------+     +---------+     +---------+
       +---------+     +---------+     +---------+     +---------+
DP 1   | TP 0-3  |---->| TP 0-3  |---->| TP 0-3  |---->| TP 0-3  |
       +---------+     +---------+     +---------+     +---------+
       ... (DP 2, 3)
```

```python
import torch
import torch.distributed as dist
from torch.distributed import DeviceMesh
from torch.distributed.tensor.parallel import (
    parallelize_module,
    ColwiseParallel,
    RowwiseParallel
)

def setup_3d_parallelism(
    data_parallel_size: int,
    tensor_parallel_size: int,
    pipeline_parallel_size: int
):
    """
    Setup 3D parallelism groups.

    Total GPUs = data_parallel_size * tensor_parallel_size * pipeline_parallel_size
    """
    world_size = dist.get_world_size()
    rank = dist.get_rank()

    expected_world_size = (data_parallel_size * tensor_parallel_size *
                          pipeline_parallel_size)
    assert world_size == expected_world_size, \
        f"World size {world_size} != expected {expected_world_size}"

    # Calculate parallel ranks
    tp_rank = rank % tensor_parallel_size
    pp_rank = (rank // tensor_parallel_size) % pipeline_parallel_size
    dp_rank = rank // (tensor_parallel_size * pipeline_parallel_size)

    # Create process groups for each dimension
    # Data parallel group: same TP and PP rank
    dp_groups = []
    for pp in range(pipeline_parallel_size):
        for tp in range(tensor_parallel_size):
            ranks = [
                dp * tensor_parallel_size * pipeline_parallel_size +
                pp * tensor_parallel_size + tp
                for dp in range(data_parallel_size)
            ]
            group = dist.new_group(ranks)
            if tp == tp_rank and pp == pp_rank:
                dp_group = group
            dp_groups.append(group)

    # Tensor parallel group: same DP and PP rank
    for dp in range(data_parallel_size):
        for pp in range(pipeline_parallel_size):
            ranks = [
                dp * tensor_parallel_size * pipeline_parallel_size +
                pp * tensor_parallel_size + tp
                for tp in range(tensor_parallel_size)
            ]
            group = dist.new_group(ranks)
            if dp == dp_rank and pp == pp_rank:
                tp_group = group

    # Pipeline parallel group: same DP and TP rank
    for dp in range(data_parallel_size):
        for tp in range(tensor_parallel_size):
            ranks = [
                dp * tensor_parallel_size * pipeline_parallel_size +
                pp * tensor_parallel_size + tp
                for pp in range(pipeline_parallel_size)
            ]
            group = dist.new_group(ranks)
            if dp == dp_rank and tp == tp_rank:
                pp_group = group

    return {
        'dp_group': dp_group,
        'tp_group': tp_group,
        'pp_group': pp_group,
        'dp_rank': dp_rank,
        'tp_rank': tp_rank,
        'pp_rank': pp_rank
    }


class Hybrid3DModel(nn.Module):
    """Model with 3D parallelism."""

    def __init__(self, config, parallel_config):
        super().__init__()
        self.config = config
        self.parallel_config = parallel_config

        # Only create layers for this pipeline stage
        pp_rank = parallel_config['pp_rank']
        pp_size = parallel_config['pp_size']
        layers_per_stage = config.num_layers // pp_size

        start_layer = pp_rank * layers_per_stage
        end_layer = start_layer + layers_per_stage

        # Create transformer blocks with tensor parallelism
        self.layers = nn.ModuleList([
            TensorParallelTransformerBlock(
                config,
                parallel_config['tp_group'],
                parallel_config['tp_rank']
            )
            for _ in range(layers_per_stage)
        ])

        # Embedding only on first stage
        if pp_rank == 0:
            self.embedding = nn.Embedding(config.vocab_size, config.hidden_dim)

        # Output only on last stage
        if pp_rank == pp_size - 1:
            self.output = nn.Linear(config.hidden_dim, config.vocab_size)
```

### Megatron-DeepSpeed Integration

```python
# Example configuration for Megatron-DeepSpeed training
# Training a 175B parameter model on 1024 GPUs

config = {
    # Model
    "hidden_size": 12288,
    "num_attention_heads": 96,
    "num_layers": 96,
    "vocab_size": 50257,
    "max_position_embeddings": 2048,

    # Parallelism
    "tensor_model_parallel_size": 8,      # 8-way TP within node
    "pipeline_model_parallel_size": 16,   # 16 pipeline stages
    "data_parallel_size": 8,              # 8-way DP
    # Total: 8 * 16 * 8 = 1024 GPUs

    # Training
    "global_batch_size": 1536,
    "micro_batch_size": 1,
    "gradient_accumulation_steps": 12,    # per DP rank

    # DeepSpeed
    "zero_optimization": {
        "stage": 1  # Only stage 1 with 3D parallelism
    },
    "fp16": {"enabled": True}
}
```

---

## Communication Primitives and Optimization

Understanding communication primitives is crucial for optimizing distributed training.

### Communication Primitives

```python
import torch
import torch.distributed as dist

def communication_primitives_demo(rank, world_size):
    """Demonstrate common distributed communication primitives."""

    # Setup
    tensor = torch.ones(4).cuda(rank) * rank

    # 1. Broadcast: One to all
    # Send tensor from src to all processes
    if rank == 0:
        tensor = torch.tensor([1, 2, 3, 4]).cuda(rank)
    dist.broadcast(tensor, src=0)
    # All ranks now have [1, 2, 3, 4]

    # 2. Reduce: All to one
    # Sum tensors from all ranks to dst
    tensor = torch.ones(4).cuda(rank) * rank
    dist.reduce(tensor, dst=0, op=dist.ReduceOp.SUM)
    # Rank 0 has sum of all tensors

    # 3. All-Reduce: All to all (reduce + broadcast)
    # Most common in gradient synchronization
    tensor = torch.ones(4).cuda(rank) * rank
    dist.all_reduce(tensor, op=dist.ReduceOp.SUM)
    # All ranks have sum

    # Available operations:
    # dist.ReduceOp.SUM, PRODUCT, MIN, MAX, BAND, BOR, BXOR

    # 4. Gather: All to one (concatenate)
    tensor = torch.ones(4).cuda(rank) * rank
    if rank == 0:
        gather_list = [torch.zeros(4).cuda() for _ in range(world_size)]
    else:
        gather_list = None
    dist.gather(tensor, gather_list, dst=0)
    # Rank 0 has list of all tensors

    # 5. All-Gather: All to all (gather to all)
    tensor = torch.ones(4).cuda(rank) * rank
    gather_list = [torch.zeros(4).cuda(rank) for _ in range(world_size)]
    dist.all_gather(gather_list, tensor)
    # All ranks have list of all tensors

    # 6. Scatter: One to all (split)
    if rank == 0:
        scatter_list = [torch.ones(4).cuda() * i for i in range(world_size)]
    else:
        scatter_list = None
    tensor = torch.zeros(4).cuda(rank)
    dist.scatter(tensor, scatter_list, src=0)
    # Each rank receives its portion

    # 7. Reduce-Scatter: Reduce then scatter
    # Each rank gets a portion of the reduced result
    input_tensor = torch.ones(world_size * 4).cuda(rank) * rank
    output_tensor = torch.zeros(4).cuda(rank)
    dist.reduce_scatter(output_tensor, [input_tensor])

    # 8. All-to-All: Personalized exchange
    input_tensors = [torch.ones(4).cuda(rank) * rank for _ in range(world_size)]
    output_tensors = [torch.zeros(4).cuda(rank) for _ in range(world_size)]
    dist.all_to_all(output_tensors, input_tensors)
    # Each rank i gets tensor[j][i] from rank j
```

### Communication Optimization

```python
class OptimizedAllReduce:
    """
    Optimized all-reduce with bucketing and overlap.
    """

    def __init__(self, model, bucket_size_mb=25):
        self.model = model
        self.bucket_size_bytes = bucket_size_mb * 1024 * 1024
        self.buckets = []
        self.current_bucket = []
        self.current_size = 0

        # Register hooks for gradient bucketing
        self._register_hooks()

    def _register_hooks(self):
        """Register backward hooks for gradient bucketing."""
        for param in self.model.parameters():
            if param.requires_grad:
                param.register_hook(self._make_hook(param))

    def _make_hook(self, param):
        def hook(grad):
            param_size = grad.numel() * grad.element_size()

            if self.current_size + param_size > self.bucket_size_bytes:
                # Start new bucket
                if self.current_bucket:
                    self._start_async_allreduce(self.current_bucket)
                self.current_bucket = []
                self.current_size = 0

            self.current_bucket.append((param, grad))
            self.current_size += param_size

        return hook

    def _start_async_allreduce(self, bucket):
        """Start asynchronous all-reduce for a bucket."""
        # Flatten gradients
        flat_grads = torch.cat([g.view(-1) for _, g in bucket])

        # Async all-reduce
        handle = dist.all_reduce(flat_grads, async_op=True)

        self.buckets.append((bucket, flat_grads, handle))

    def finish_gradient_sync(self):
        """Wait for all async operations and unflatten."""
        # Handle last bucket
        if self.current_bucket:
            self._start_async_allreduce(self.current_bucket)

        # Wait and unflatten
        world_size = dist.get_world_size()

        for bucket, flat_grads, handle in self.buckets:
            handle.wait()
            flat_grads.div_(world_size)

            # Unflatten back to parameters
            offset = 0
            for param, grad in bucket:
                numel = grad.numel()
                param.grad = flat_grads[offset:offset+numel].view_as(grad)
                offset += numel

        # Reset
        self.buckets = []
        self.current_bucket = []
        self.current_size = 0


class GradientCompression:
    """
    Gradient compression for bandwidth-limited scenarios.
    """

    @staticmethod
    def top_k_compress(tensor, k_ratio=0.01):
        """
        Top-K sparsification: Keep only top K% of gradient values.
        """
        k = max(1, int(tensor.numel() * k_ratio))
        values, indices = torch.topk(tensor.abs().view(-1), k)

        # Create sparse representation
        compressed = torch.zeros_like(tensor.view(-1))
        signs = torch.sign(tensor.view(-1)[indices])
        compressed[indices] = values * signs

        return compressed.view_as(tensor), indices

    @staticmethod
    def random_k_compress(tensor, k_ratio=0.01):
        """
        Random-K sparsification: Randomly sample K% of gradients.
        """
        k = max(1, int(tensor.numel() * k_ratio))
        indices = torch.randperm(tensor.numel())[:k]

        compressed = torch.zeros_like(tensor.view(-1))
        compressed[indices] = tensor.view(-1)[indices] / k_ratio

        return compressed.view_as(tensor)

    @staticmethod
    def quantize_gradients(tensor, bits=8):
        """
        Quantize gradients to reduce precision.
        """
        min_val = tensor.min()
        max_val = tensor.max()

        # Scale to [0, 2^bits - 1]
        scale = (max_val - min_val) / (2**bits - 1)
        quantized = ((tensor - min_val) / scale).round().to(torch.uint8)

        return quantized, min_val, scale

    @staticmethod
    def dequantize_gradients(quantized, min_val, scale):
        """Dequantize gradients."""
        return quantized.float() * scale + min_val
```

---

## Best Practices and Debugging

### Best Practices

```python
# Always set random seeds for reproducibility
def set_seeds(seed=42, rank=0):
    import random
    import numpy as np

    seed = seed + rank  # Different seed per rank for data augmentation
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)

# Use gradient checkpointing for large models
from torch.utils.checkpoint import checkpoint

class CheckpointedTransformerBlock(nn.Module):
    def __init__(self, hidden_dim, num_heads):
        super().__init__()
        self.attention = nn.MultiheadAttention(hidden_dim, num_heads)
        self.mlp = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim * 4),
            nn.GELU(),
            nn.Linear(hidden_dim * 4, hidden_dim)
        )
        self.norm1 = nn.LayerNorm(hidden_dim)
        self.norm2 = nn.LayerNorm(hidden_dim)

    def forward(self, x):
        # Use checkpointing to trade compute for memory
        x = x + checkpoint(
            lambda y: self.attention(y, y, y)[0],
            self.norm1(x),
            use_reentrant=False
        )
        x = x + checkpoint(self.mlp, self.norm2(x), use_reentrant=False)
        return x

# Synchronize batch normalization across GPUs
model = nn.SyncBatchNorm.convert_sync_batchnorm(model)

# Learning rate scaling for large batch sizes
def scale_learning_rate(base_lr, base_batch_size, actual_batch_size, world_size):
    """Linear scaling rule."""
    effective_batch_size = actual_batch_size * world_size
    return base_lr * (effective_batch_size / base_batch_size)

# Warmup for large batch training
def get_warmup_scheduler(optimizer, warmup_steps, total_steps):
    def lr_lambda(step):
        if step < warmup_steps:
            return step / warmup_steps
        return 1.0
    return torch.optim.lr_scheduler.LambdaLR(optimizer, lr_lambda)

# Gradient accumulation with proper scaling
def train_step_with_accumulation(model, batch, accumulation_steps, step):
    loss = model(batch) / accumulation_steps
    loss.backward()

    if (step + 1) % accumulation_steps == 0:
        optimizer.step()
        optimizer.zero_grad()

# Save checkpoints properly with DDP/FSDP
def save_checkpoint(model, optimizer, epoch, path, is_distributed=True):
    if is_distributed:
        # Get underlying model
        model_to_save = model.module if hasattr(model, 'module') else model

        # Only save from rank 0
        if dist.get_rank() == 0:
            torch.save({
                'epoch': epoch,
                'model_state_dict': model_to_save.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
            }, path)

        # Barrier to ensure save completes before continuing
        dist.barrier()
    else:
        torch.save({
            'epoch': epoch,
            'model_state_dict': model.state_dict(),
            'optimizer_state_dict': optimizer.state_dict(),
        }, path)
```

### Debugging Distributed Training

```python
import os
import torch
import torch.distributed as dist

class DistributedDebugger:
    """Utilities for debugging distributed training."""

    @staticmethod
    def print_rank(message, rank=None):
        """Print from specific rank or all ranks with rank prefix."""
        current_rank = dist.get_rank() if dist.is_initialized() else 0

        if rank is None or current_rank == rank:
            print(f"[Rank {current_rank}] {message}")

    @staticmethod
    def check_tensor_sync(tensor, name="tensor"):
        """Verify tensors are synchronized across ranks."""
        if not dist.is_initialized():
            return True

        world_size = dist.get_world_size()
        rank = dist.get_rank()

        # Gather tensors from all ranks
        tensor_list = [torch.zeros_like(tensor) for _ in range(world_size)]
        dist.all_gather(tensor_list, tensor)

        # Check if all are equal
        is_synced = all(torch.allclose(tensor_list[0], t) for t in tensor_list)

        if not is_synced and rank == 0:
            print(f"WARNING: {name} not synchronized!")
            for i, t in enumerate(tensor_list):
                print(f"  Rank {i}: {t[:5]}...")  # Print first 5 elements

        return is_synced

    @staticmethod
    def check_gradient_health(model):
        """Check for gradient issues (NaN, Inf, very large/small)."""
        issues = []

        for name, param in model.named_parameters():
            if param.grad is not None:
                grad = param.grad

                if torch.isnan(grad).any():
                    issues.append(f"NaN gradient in {name}")
                elif torch.isinf(grad).any():
                    issues.append(f"Inf gradient in {name}")
                else:
                    grad_norm = grad.norm().item()
                    if grad_norm > 1000:
                        issues.append(f"Large gradient in {name}: {grad_norm:.2f}")
                    elif grad_norm < 1e-8 and grad_norm > 0:
                        issues.append(f"Tiny gradient in {name}: {grad_norm:.2e}")

        return issues

    @staticmethod
    def profile_communication():
        """Profile NCCL communication."""
        os.environ['NCCL_DEBUG'] = 'INFO'
        os.environ['NCCL_DEBUG_SUBSYS'] = 'ALL'

        # For detailed timing
        os.environ['TORCH_DISTRIBUTED_DEBUG'] = 'DETAIL'

    @staticmethod
    def memory_summary(device=None):
        """Print GPU memory summary."""
        if device is None:
            device = torch.cuda.current_device()

        allocated = torch.cuda.memory_allocated(device) / 1024**3
        reserved = torch.cuda.memory_reserved(device) / 1024**3
        max_allocated = torch.cuda.max_memory_allocated(device) / 1024**3

        print(f"GPU {device} Memory:")
        print(f"  Allocated: {allocated:.2f} GB")
        print(f"  Reserved:  {reserved:.2f} GB")
        print(f"  Max Allocated: {max_allocated:.2f} GB")


def diagnose_hanging():
    """
    Common causes of distributed training hangs:

    1. Unequal operations across ranks:
       - Different control flow (if statements based on data)
       - Different numbers of forward/backward calls

    2. Deadlocks:
       - Barrier called by some but not all ranks
       - Collective operations with different tensors

    3. NCCL issues:
       - Network problems
       - Timeout too short
    """
    # Set longer timeout
    os.environ['NCCL_TIMEOUT'] = '1800'  # 30 minutes

    # Enable NCCL debugging
    os.environ['NCCL_DEBUG'] = 'INFO'

    # Use gloo backend for debugging (more verbose errors)
    # dist.init_process_group(backend='gloo')


def trace_deadlock():
    """
    Add synchronization points to find where hanging occurs.
    """
    def sync_point(name):
        rank = dist.get_rank()
        print(f"[Rank {rank}] Reached: {name}")
        dist.barrier()
        print(f"[Rank {rank}] Passed: {name}")

    # Use throughout code:
    # sync_point("before_forward")
    # output = model(input)
    # sync_point("after_forward")
```

---

## Interview Questions

### Fundamental Questions

**Q1: Explain the differences between DataParallel and DistributedDataParallel.**

```
DataParallel (DP):
- Single process, multiple threads
- GIL bottleneck limits performance
- GPU 0 handles output gathering (memory imbalance)
- Only works on single node
- Simple to use but inefficient

DistributedDataParallel (DDP):
- Multiple processes (one per GPU)
- No GIL bottleneck
- Balanced memory across GPUs
- Works across multiple nodes
- Uses NCCL for efficient communication
- Overlaps communication with computation

Always prefer DDP for production training.
```

**Q2: What is the difference between ZeRO Stage 1, 2, and 3?**

```
ZeRO Stage 1:
- Partitions optimizer states (momentum, variance in Adam)
- Memory reduction: ~4x for Adam
- Communication: Same as DDP

ZeRO Stage 2:
- Stage 1 + partitions gradients
- Memory reduction: ~8x
- Communication: Reduce-scatter for gradients

ZeRO Stage 3:
- Stage 2 + partitions parameters
- Memory reduction: Linear with #GPUs
- Communication: All-gather parameters during forward/backward
- Highest communication overhead but enables largest models
```

**Q3: When should you use Pipeline Parallelism vs Data Parallelism?**

```
Use Data Parallelism when:
- Model fits in single GPU memory
- You want to scale batch size
- Dataset is large
- Simpler implementation needed

Use Pipeline Parallelism when:
- Model is too large for single GPU
- Memory is the bottleneck, not compute
- You have balanced model stages
- Can afford bubble overhead

Often combine both:
- PP to fit model across GPUs within node
- DP across nodes
```

**Q4: How does gradient accumulation work with distributed training?**

```python
# Effective batch size = micro_batch * accumulation_steps * world_size

def train_with_accumulation(model, dataloader, accumulation_steps):
    for i, batch in enumerate(dataloader):
        # Use no_sync to skip gradient sync for intermediate steps
        if (i + 1) % accumulation_steps != 0:
            with model.no_sync():  # DDP specific
                loss = model(batch) / accumulation_steps
                loss.backward()
        else:
            # Sync gradients on last accumulation step
            loss = model(batch) / accumulation_steps
            loss.backward()
            optimizer.step()
            optimizer.zero_grad()
```

### Advanced Questions

**Q5: Design a training system for a 70B parameter model on 64 GPUs (8 nodes x 8 GPUs).**

```
Considerations:
1. Model memory: 70B params * 2 bytes (fp16) = 140GB (model only)
2. Full training memory: ~560GB (model + gradients + optimizer + activations)

Recommended strategy: 3D Parallelism

Configuration:
- Tensor Parallel: 8-way (within node, fast NVLink)
- Pipeline Parallel: 4-way (across 4 nodes)
- Data Parallel: 2-way (remaining 2 nodes per PP stage)

Memory breakdown per GPU:
- Parameters: 140GB / 8 (TP) / 4 (PP) = 4.4GB
- Gradients: 4.4GB
- Optimizer (FP32): 17.5GB
- Activations: ~10GB (with checkpointing)
- Total: ~36GB (fits in 80GB A100)

Additional optimizations:
- Activation checkpointing
- Mixed precision (BF16)
- Gradient accumulation for larger effective batch size
```

**Q6: Explain the communication patterns in different parallelism strategies.**

```
Data Parallelism:
- All-reduce gradients after backward
- O(model_size) communication per step
- Can overlap with computation

Tensor Parallelism:
- All-reduce after each layer's forward AND backward
- O(batch_size * hidden_dim) per layer
- Must be synchronous (within layer)
- Best within node (needs low latency)

Pipeline Parallelism:
- Point-to-point between adjacent stages
- O(batch_size * hidden_dim) per micro-batch
- Bubble overhead depends on micro-batch count

FSDP/ZeRO-3:
- All-gather parameters before forward
- Reduce-scatter gradients after backward
- All-reduce for optimizer step (ZeRO-1/2)
- Higher communication but enables larger models
```

**Q7: How would you debug a distributed training job that hangs?**

```
Debugging steps:

1. Enable verbose logging:
   export NCCL_DEBUG=INFO
   export TORCH_DISTRIBUTED_DEBUG=DETAIL
   export CUDA_LAUNCH_BLOCKING=1

2. Add synchronization checkpoints:
   def sync_point(name):
       print(f"[Rank {rank}] {name}")
       dist.barrier()

3. Check for unequal operations:
   - Print shape/count of operations per rank
   - Ensure same number of forward/backward calls
   - Check for rank-dependent control flow

4. Common causes:
   - Some ranks finishing early (check data loader lengths)
   - Timeout too short (increase NCCL_TIMEOUT)
   - Network issues (check connectivity)
   - OOM on some ranks (check memory per rank)

5. Use NCCL async error handling:
   os.environ['NCCL_ASYNC_ERROR_HANDLING'] = '1'
```

**Q8: Compare DeepSpeed ZeRO-3 vs PyTorch FSDP for training large models.**

```
DeepSpeed ZeRO-3:
Pros:
- More mature, battle-tested on very large models
- NVMe offloading (ZeRO-Infinity)
- Optimized CUDA kernels
- Better documentation for specific configs

Cons:
- External dependency
- Config-heavy
- Debugging can be difficult

PyTorch FSDP:
Pros:
- Native PyTorch (better debugging)
- Simpler API
- Good integration with PyTorch ecosystem
- Actively developed

Cons:
- Less mature than DeepSpeed
- No NVMe offloading
- Fewer optimization options

Recommendation:
- For cutting-edge large models: DeepSpeed
- For most use cases: FSDP (simpler, native)
- For HuggingFace models: Either works well
```

---

## Summary

Distributed training is essential for modern deep learning at scale. Key takeaways:

1. **Start Simple**: Begin with DDP before exploring advanced strategies

2. **Choose the Right Strategy**:
   - Data Parallelism: Default for most cases
   - Model Parallelism: When model exceeds GPU memory
   - Pipeline Parallelism: For very deep models
   - Tensor Parallelism: For very wide layers
   - Hybrid: For largest models (combine strategies)

3. **Memory Optimization**:
   - ZeRO/FSDP for parameter sharding
   - Gradient checkpointing for activations
   - Mixed precision for compute and memory
   - CPU/NVMe offloading as last resort

4. **Communication Optimization**:
   - Keep tensor parallelism within nodes (NVLink)
   - Overlap communication with computation
   - Use gradient bucketing and compression when needed

5. **Debugging**:
   - Enable NCCL debugging
   - Add synchronization checkpoints
   - Monitor memory and communication

---

## Further Reading

### Papers
- "Megatron-LM: Training Multi-Billion Parameter Language Models Using Model Parallelism" (NVIDIA)
- "ZeRO: Memory Optimizations Toward Training Trillion Parameter Models" (Microsoft)
- "GPipe: Efficient Training of Giant Neural Networks using Pipeline Parallelism" (Google)
- "Efficient Large-Scale Language Model Training on GPU Clusters Using Megatron-LM" (NVIDIA)

### Documentation
- [PyTorch Distributed Training](https://pytorch.org/tutorials/intermediate/ddp_tutorial.html)
- [PyTorch FSDP](https://pytorch.org/tutorials/intermediate/FSDP_tutorial.html)
- [DeepSpeed Documentation](https://www.deepspeed.ai/)
- [Megatron-LM](https://github.com/NVIDIA/Megatron-LM)

### Frameworks
- DeepSpeed: Microsoft's distributed training library
- FairScale: Facebook's training utilities
- PyTorch Lightning: High-level distributed training
- Hugging Face Accelerate: Simple distributed training wrapper
- ColossalAI: Efficient large model training
