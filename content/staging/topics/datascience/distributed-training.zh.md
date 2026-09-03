---
title: 分布式训练深度解析
description: 全面掌握大规模深度学习分布式训练技术，包括数据并行、模型并行、流水线并行、DeepSpeed和FSDP
track: datascience
section: deployment
difficulty: advanced
tags:
  - 分布式训练
  - DeepSpeed
  - FSDP
  - 数据并行
  - 模型并行
  - 流水线并行
  - PyTorch
status: imported
origin: old/src/content/docs/datascience/distributed-training.zh.md
divergence: 0.292
issues:
  - order-mismatch
legacy:
  category: DataScience
  subcategory: MLSystems
  order: 25
  lastUpdated: 2026-01-07
---

随着深度学习模型规模的急剧增长，从 BERT 的 3.4 亿参数到 GPT-4 的万亿级参数，单机单卡训练已经远远无法满足需求。分布式训练成为了训练大规模模型的必备技术。本文将系统性地介绍分布式训练的核心概念、主流并行策略以及工业级框架的使用方法。

---

## 分布式训练基础

### 为什么需要分布式训练

分布式训练的需求主要来自以下几个方面：

1. **模型规模增长**：现代大语言模型参数量动辄数十亿甚至上万亿，单张 GPU 显存（即使是 80GB 的 A100）也无法容纳
2. **训练数据量增大**：大规模数据集需要更长的训练时间，分布式可以显著加速
3. **训练时间约束**：商业场景下需要在有限时间内完成模型迭代
4. **成本优化**：合理的分布式策略可以提高硬件利用率

### 核心概念

#### 集群拓扑结构

```
                    ┌─────────────────────────────────────┐
                    │           集群 (Cluster)             │
                    │                                     │
                    │  ┌─────────┐       ┌─────────┐     │
                    │  │ Node 0  │       │ Node 1  │     │
                    │  │         │       │         │     │
                    │  │ GPU0-7  │◄─────►│ GPU0-7  │     │
                    │  │         │ NVLink│         │     │
                    │  └────┬────┘ /IB   └────┬────┘     │
                    │       │                  │          │
                    │       └───────┬──────────┘          │
                    │               │                     │
                    │          InfiniBand                 │
                    │          High-Speed                 │
                    │          Network                    │
                    └─────────────────────────────────────┘
```

**关键术语：**

- **World Size**：参与训练的总进程数（通常等于 GPU 数量）
- **Rank**：每个进程的唯一标识符（0 到 world_size-1）
- **Local Rank**：单个节点内的进程编号
- **Node**：物理机器，通常包含多张 GPU
- **Master Node**：负责协调的主节点

```python
import torch.distributed as dist
import os

def setup_distributed():
    """初始化分布式环境"""
    # 从环境变量获取分布式信息
    rank = int(os.environ.get("RANK", 0))
    local_rank = int(os.environ.get("LOCAL_RANK", 0))
    world_size = int(os.environ.get("WORLD_SIZE", 1))

    # 初始化进程组
    dist.init_process_group(
        backend="nccl",  # GPU 推荐使用 NCCL
        init_method="env://",
        world_size=world_size,
        rank=rank
    )

    # 设置当前进程使用的 GPU
    torch.cuda.set_device(local_rank)

    return rank, local_rank, world_size

def cleanup_distributed():
    """清理分布式环境"""
    dist.destroy_process_group()
```

#### 通信后端

| 后端 | 适用场景 | 特点 |
|------|----------|------|
| NCCL | GPU 训练 | 高性能、支持多 GPU 通信 |
| Gloo | CPU 训练、跨平台 | 通用性强、性能适中 |
| MPI | HPC 环境 | 功能丰富、配置复杂 |

#### 集合通信原语

```python
import torch
import torch.distributed as dist

def demonstrate_collective_ops():
    """演示常用的集合通信操作"""
    rank = dist.get_rank()
    world_size = dist.get_world_size()
    device = torch.device(f"cuda:{rank}")

    # 1. Broadcast: 将数据从一个进程广播到所有进程
    tensor = torch.tensor([rank], device=device)
    dist.broadcast(tensor, src=0)  # 从 rank 0 广播
    print(f"Rank {rank} after broadcast: {tensor}")

    # 2. Reduce: 将所有进程的数据归约到一个进程
    tensor = torch.tensor([rank + 1], device=device, dtype=torch.float)
    dist.reduce(tensor, dst=0, op=dist.ReduceOp.SUM)
    if rank == 0:
        print(f"Sum after reduce: {tensor}")  # 输出: 1+2+3+...+world_size

    # 3. All-Reduce: 归约后将结果广播到所有进程
    tensor = torch.tensor([rank + 1], device=device, dtype=torch.float)
    dist.all_reduce(tensor, op=dist.ReduceOp.SUM)
    print(f"Rank {rank} after all_reduce: {tensor}")

    # 4. All-Gather: 收集所有进程的数据
    tensor = torch.tensor([rank], device=device)
    tensor_list = [torch.zeros(1, device=device, dtype=torch.long)
                   for _ in range(world_size)]
    dist.all_gather(tensor_list, tensor)
    print(f"Rank {rank} after all_gather: {tensor_list}")

    # 5. Scatter: 将数据分散到各进程
    if rank == 0:
        scatter_list = [torch.tensor([i * 10], device=device)
                       for i in range(world_size)]
    else:
        scatter_list = None
    output = torch.zeros(1, device=device, dtype=torch.long)
    dist.scatter(output, scatter_list, src=0)
    print(f"Rank {rank} after scatter: {output}")
```

**通信操作可视化：**

```
All-Reduce 操作示意图:

   GPU 0          GPU 1          GPU 2          GPU 3
    [1]            [2]            [3]            [4]
     │              │              │              │
     └──────────────┴──────────────┴──────────────┘
                          │
                     All-Reduce
                      (SUM)
                          │
     ┌──────────────┬──────────────┬──────────────┐
     │              │              │              │
    [10]           [10]           [10]           [10]
   GPU 0          GPU 1          GPU 2          GPU 3
```

---

## 数据并行 (Data Parallelism)

数据并行是最常见也是最简单的分布式训练策略，其核心思想是将数据划分到多个设备，每个设备持有完整的模型副本。

### 基本原理

```
数据并行工作流程:

  ┌─────────────────────────────────────────────────────────────────┐
  │                      完整训练数据集                               │
  └───────┬───────────────┬───────────────┬───────────────┬─────────┘
          │               │               │               │
          ▼               ▼               ▼               ▼
    ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
    │ Batch 0 │     │ Batch 1 │     │ Batch 2 │     │ Batch 3 │
    └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
         │               │               │               │
         ▼               ▼               ▼               ▼
    ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
    │ Model   │     │ Model   │     │ Model   │     │ Model   │
    │ (GPU 0) │     │ (GPU 1) │     │ (GPU 2) │     │ (GPU 3) │
    └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
         │               │               │               │
         │          Forward Pass         │               │
         ▼               ▼               ▼               ▼
    ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
    │ Grad 0  │     │ Grad 1  │     │ Grad 2  │     │ Grad 3  │
    └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
         │               │               │               │
         └───────────────┴───────┬───────┴───────────────┘
                                 │
                           All-Reduce
                         (梯度平均)
                                 │
         ┌───────────────┬───────┴───────┬───────────────┐
         │               │               │               │
         ▼               ▼               ▼               ▼
    ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
    │ Update  │     │ Update  │     │ Update  │     │ Update  │
    │ Model   │     │ Model   │     │ Model   │     │ Model   │
    └─────────┘     └─────────┘     └─────────┘     └─────────┘
```

### PyTorch DistributedDataParallel (DDP)

DDP 是 PyTorch 推荐的数据并行实现，相比 DataParallel 具有更好的性能。

```python
import torch
import torch.nn as nn
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.utils.data import DataLoader, DistributedSampler
import os

class SimpleModel(nn.Module):
    """示例模型"""
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

def train_with_ddp(rank, world_size, epochs=10):
    """使用 DDP 进行分布式训练"""
    # 初始化分布式环境
    os.environ['MASTER_ADDR'] = 'localhost'
    os.environ['MASTER_PORT'] = '12355'
    dist.init_process_group("nccl", rank=rank, world_size=world_size)

    # 创建模型并移动到对应 GPU
    device = torch.device(f"cuda:{rank}")
    model = SimpleModel(784, 256, 10).to(device)

    # 用 DDP 包装模型
    ddp_model = DDP(model, device_ids=[rank])

    # 创建数据集和分布式采样器
    dataset = torch.utils.data.TensorDataset(
        torch.randn(10000, 784),
        torch.randint(0, 10, (10000,))
    )

    # DistributedSampler 确保每个进程获得不同的数据子集
    sampler = DistributedSampler(
        dataset,
        num_replicas=world_size,
        rank=rank,
        shuffle=True
    )

    dataloader = DataLoader(
        dataset,
        batch_size=64,
        sampler=sampler,
        num_workers=4,
        pin_memory=True
    )

    # 定义优化器和损失函数
    optimizer = torch.optim.Adam(ddp_model.parameters(), lr=0.001)
    criterion = nn.CrossEntropyLoss()

    # 训练循环
    for epoch in range(epochs):
        sampler.set_epoch(epoch)  # 重要：确保每个 epoch 的 shuffle 不同
        ddp_model.train()

        total_loss = 0
        for batch_idx, (data, target) in enumerate(dataloader):
            data, target = data.to(device), target.to(device)

            optimizer.zero_grad()
            output = ddp_model(data)
            loss = criterion(output, target)
            loss.backward()
            optimizer.step()

            total_loss += loss.item()

        # 同步并打印损失（仅在 rank 0 打印）
        avg_loss = total_loss / len(dataloader)
        if rank == 0:
            print(f"Epoch {epoch}, Loss: {avg_loss:.4f}")

    dist.destroy_process_group()

# 启动分布式训练
if __name__ == "__main__":
    world_size = torch.cuda.device_count()
    torch.multiprocessing.spawn(
        train_with_ddp,
        args=(world_size,),
        nprocs=world_size,
        join=True
    )
```

### DDP 核心优化机制

#### 梯度分桶 (Gradient Bucketing)

DDP 将梯度分组到多个桶中，以重叠计算和通信：

```python
# DDP 会自动进行梯度分桶，但可以自定义桶大小
ddp_model = DDP(
    model,
    device_ids=[rank],
    bucket_cap_mb=25  # 每个桶的最大大小（MB）
)
```

```
梯度分桶和通信重叠:

时间 ─────────────────────────────────────────────────────────────►

层:    Layer N    Layer N-1   Layer N-2   Layer N-3   Layer N-4
       ┌─────┐    ┌─────┐     ┌─────┐     ┌─────┐     ┌─────┐
反向   │Grad │    │Grad │     │Grad │     │Grad │     │Grad │
传播   └──┬──┘    └──┬──┘     └──┬──┘     └──┬──┘     └──┬──┘
          │         │           │           │           │
          ▼         │           │           │           │
       ┌─────┐      │           │           │           │
Bucket │AR   │      ▼           │           │           │
  1    └─────┘   ┌─────┐        │           │           │
                 │AR   │        ▼           │           │
                 └─────┘     ┌─────┐        │           │
Bucket                       │AR   │        ▼           │
  2                          └─────┘     ┌─────┐        │
                                         │AR   │        ▼
                                         └─────┘     ┌─────┐
Bucket                                               │AR   │
  3                                                  └─────┘

AR = All-Reduce 操作
```

#### 梯度压缩

使用梯度压缩减少通信量：

```python
from torch.distributed.algorithms.ddp_comm_hooks import (
    default_hooks as default,
    powerSGD_hook as powerSGD
)

# 使用 FP16 压缩
ddp_model.register_comm_hook(
    state=None,
    hook=default.fp16_compress_hook
)

# 使用 PowerSGD 进行更激进的压缩
ddp_model.register_comm_hook(
    state=powerSGD.PowerSGDState(
        process_group=None,
        matrix_approximation_rank=1,
        start_powerSGD_iter=10
    ),
    hook=powerSGD.powerSGD_hook
)
```

---

## 模型并行 (Model Parallelism)

当模型太大无法放入单个 GPU 时，需要将模型拆分到多个设备上，这就是模型并行。

### 基本原理

```
模型并行示意图:

单个大模型拆分到多个 GPU:

┌─────────────────────────────────────────────────────────────────┐
│                        完整模型                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ Layer 1-4│  │Layer 5-8 │  │Layer 9-12│  │Layer13-16│        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
        │               │               │               │
        ▼               ▼               ▼               ▼
   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
   │  GPU 0  │───►│  GPU 1  │───►│  GPU 2  │───►│  GPU 3  │
   │Layer1-4 │    │Layer5-8 │    │Layer9-12│    │Layer13-16│
   └─────────┘    └─────────┘    └─────────┘    └─────────┘
```

### 手动实现模型并行

```python
import torch
import torch.nn as nn

class ModelParallelResNet(nn.Module):
    """跨多 GPU 的模型并行 ResNet"""

    def __init__(self, num_classes=1000):
        super().__init__()

        # 第一部分放在 GPU 0
        self.seq1 = nn.Sequential(
            nn.Conv2d(3, 64, kernel_size=7, stride=2, padding=3),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(kernel_size=3, stride=2, padding=1),
            self._make_layer(64, 64, 3),
            self._make_layer(64, 128, 4, stride=2)
        ).to('cuda:0')

        # 第二部分放在 GPU 1
        self.seq2 = nn.Sequential(
            self._make_layer(128, 256, 6, stride=2),
            self._make_layer(256, 512, 3, stride=2),
            nn.AdaptiveAvgPool2d((1, 1)),
            nn.Flatten(),
            nn.Linear(512, num_classes)
        ).to('cuda:1')

    def _make_layer(self, in_channels, out_channels, blocks, stride=1):
        layers = []
        layers.append(nn.Conv2d(in_channels, out_channels, 3, stride, 1))
        layers.append(nn.BatchNorm2d(out_channels))
        layers.append(nn.ReLU())
        for _ in range(1, blocks):
            layers.append(nn.Conv2d(out_channels, out_channels, 3, 1, 1))
            layers.append(nn.BatchNorm2d(out_channels))
            layers.append(nn.ReLU())
        return nn.Sequential(*layers)

    def forward(self, x):
        # 数据在 GPU 0 上处理第一部分
        x = self.seq1(x.to('cuda:0'))
        # 将中间结果传到 GPU 1 处理第二部分
        x = self.seq2(x.to('cuda:1'))
        return x

# 使用模型并行
model = ModelParallelResNet()
inputs = torch.randn(32, 3, 224, 224)
outputs = model(inputs)
loss = outputs.sum()
loss.backward()
```

### 使用 PyTorch 的 device_map

```python
from transformers import AutoModelForCausalLM, AutoTokenizer

# Hugging Face Transformers 支持自动设备映射
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-2-7b-hf",
    device_map="auto",  # 自动分配层到不同 GPU
    torch_dtype=torch.float16
)

# 也可以手动指定
device_map = {
    "model.embed_tokens": 0,
    "model.layers.0": 0,
    "model.layers.1": 0,
    # ... 更多层
    "model.layers.30": 1,
    "model.layers.31": 1,
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

## 流水线并行 (Pipeline Parallelism)

流水线并行是模型并行的改进版本，通过将输入数据拆分为微批次并流水线执行来提高 GPU 利用率。

### 基本原理

```
朴素模型并行的问题 (GPU 利用率低):

时间 ──────────────────────────────────────────────────────────────►
      │ Micro-batch 1                                              │
      │                                                             │
GPU 0 │████████████████│                │                │         │
      │  Forward       │                │                │         │
      │                │                │                │         │
GPU 1 │                │████████████████│                │         │
      │                │  Forward       │                │         │
      │                │                │                │         │
GPU 2 │                │                │████████████████│         │
      │                │                │  Forward       │         │
      │                │                │                │         │
GPU 3 │                │                │                │█████████│
      │                │                │                │ Forward │

█ = GPU 正在工作
空白 = GPU 空闲（称为"气泡"）


流水线并行 (提高利用率):

时间 ──────────────────────────────────────────────────────────────►
      │ MB1  │ MB2  │ MB3  │ MB4  │                                 │
      │      │      │      │      │                                 │
GPU 0 │██████│██████│██████│██████│      │      │      │      │    │
      │      │      │      │      │      │      │      │      │    │
GPU 1 │      │██████│██████│██████│██████│      │      │      │    │
      │      │      │      │      │      │      │      │      │    │
GPU 2 │      │      │██████│██████│██████│██████│      │      │    │
      │      │      │      │      │      │      │      │      │    │
GPU 3 │      │      │      │██████│██████│██████│██████│      │    │

MB = Micro-batch
通过将 batch 拆分为多个 micro-batch，实现流水线并行
```

### GPipe 调度策略

```python
import torch
import torch.nn as nn
from torch.distributed.pipeline.sync import Pipe

class GPipeModel(nn.Module):
    """使用 GPipe 风格的流水线并行"""

    def __init__(self):
        super().__init__()

        # 将模型分为多个阶段
        self.stage1 = nn.Sequential(
            nn.Linear(1024, 2048),
            nn.ReLU(),
            nn.Linear(2048, 2048),
            nn.ReLU()
        )

        self.stage2 = nn.Sequential(
            nn.Linear(2048, 2048),
            nn.ReLU(),
            nn.Linear(2048, 2048),
            nn.ReLU()
        )

        self.stage3 = nn.Sequential(
            nn.Linear(2048, 2048),
            nn.ReLU(),
            nn.Linear(2048, 1024),
            nn.ReLU()
        )

        self.stage4 = nn.Sequential(
            nn.Linear(1024, 512),
            nn.ReLU(),
            nn.Linear(512, 10)
        )

    def forward(self, x):
        x = self.stage1(x)
        x = self.stage2(x)
        x = self.stage3(x)
        x = self.stage4(x)
        return x

def create_pipeline_model():
    """创建流水线并行模型"""
    model = GPipeModel()

    # 将各阶段分配到不同 GPU
    model.stage1 = model.stage1.to('cuda:0')
    model.stage2 = model.stage2.to('cuda:1')
    model.stage3 = model.stage3.to('cuda:2')
    model.stage4 = model.stage4.to('cuda:3')

    # 使用 Pipe 包装（需要将模型转换为 nn.Sequential）
    from torch.distributed.pipeline.sync import Pipe

    # 创建一个包装模型用于 Pipe
    fc1 = model.stage1.to('cuda:0')
    fc2 = model.stage2.to('cuda:1')
    fc3 = model.stage3.to('cuda:2')
    fc4 = model.stage4.to('cuda:3')

    # Pipe 需要 nn.Sequential
    pipe_model = nn.Sequential(fc1, fc2, fc3, fc4)
    pipe_model = Pipe(pipe_model, chunks=8)  # 将 batch 分成 8 个 micro-batches

    return pipe_model
```

### 1F1B 调度策略

1F1B (One Forward One Backward) 是一种更高效的流水线调度策略：

```
1F1B 调度示意图:

时间 ──────────────────────────────────────────────────────────────────────────►

      │ F1  │ F2  │ F3  │ F4  │ B4  │ B3  │ B2  │ B1  │                        │
GPU 0 │█████│█████│█████│█████│░░░░░│░░░░░│░░░░░│░░░░░│                        │
      │     │ F1  │ F2  │ F3  │ F4  │ B4  │ B3  │ B2  │ B1  │                   │
GPU 1 │     │█████│█████│█████│█████│░░░░░│░░░░░│░░░░░│░░░░░│                   │
      │     │     │ F1  │ F2  │ F3  │ F4  │ B4  │ B3  │ B2  │ B1  │             │
GPU 2 │     │     │█████│█████│█████│█████│░░░░░│░░░░░│░░░░░│░░░░░│             │
      │     │     │     │ F1  │ F2  │ F3  │ F4  │ B4  │ B3  │ B2  │ B1  │       │
GPU 3 │     │     │     │█████│█████│█████│█████│░░░░░│░░░░░│░░░░░│░░░░░│       │

█ = Forward pass
░ = Backward pass
F1-F4 = Forward micro-batches 1-4
B1-B4 = Backward micro-batches 1-4
```

```python
class PipelineScheduler:
    """1F1B 流水线调度器的简化实现"""

    def __init__(self, num_stages, num_microbatches):
        self.num_stages = num_stages
        self.num_microbatches = num_microbatches

    def generate_schedule(self):
        """生成 1F1B 调度计划"""
        schedule = []

        # Warmup 阶段：只有 forward
        for i in range(self.num_stages):
            for stage in range(i + 1):
                schedule.append(('forward', i - stage, stage))

        # Steady 阶段：交替 forward 和 backward
        for i in range(self.num_stages, self.num_microbatches):
            # 每个 stage 执行一次 forward，然后一次 backward
            for stage in range(self.num_stages):
                schedule.append(('forward', i - stage, stage))
            for stage in range(self.num_stages - 1, -1, -1):
                schedule.append(('backward', i - self.num_stages + 1 + stage, stage))

        # Cooldown 阶段：只有 backward
        for i in range(self.num_microbatches - self.num_stages, self.num_microbatches):
            for stage in range(self.num_stages - 1, -1, -1):
                schedule.append(('backward', i + stage + 1, stage))

        return schedule

# 使用示例
scheduler = PipelineScheduler(num_stages=4, num_microbatches=8)
schedule = scheduler.generate_schedule()
for step in schedule:
    print(f"Operation: {step[0]}, Microbatch: {step[1]}, Stage: {step[2]}")
```

---

## 张量并行 (Tensor Parallelism)

张量并行将单个层的计算拆分到多个设备上，特别适合大型矩阵运算。

### 基本原理

```
张量并行 - 列并行 (Column Parallelism):

输入 X: [batch, seq_len, hidden]
权重 W: [hidden, 4*hidden]

将权重按列拆分:
W = [W1 | W2 | W3 | W4]

       ┌─────────────────────────────────────────────────┐
       │              Input X (共享)                      │
       └─────────────────────────────────────────────────┘
                              │
        ┌─────────┬───────────┼───────────┬─────────┐
        │         │           │           │         │
        ▼         ▼           ▼           ▼         │
   ┌────────┐┌────────┐ ┌────────┐ ┌────────┐      │
   │  W1    ││  W2    │ │  W3    │ │  W4    │      │
   │(GPU 0) ││(GPU 1) │ │(GPU 2) │ │(GPU 3) │      │
   └───┬────┘└───┬────┘ └───┬────┘ └───┬────┘      │
       │         │           │           │         │
       ▼         ▼           ▼           ▼         │
   ┌────────┐┌────────┐ ┌────────┐ ┌────────┐      │
   │  Y1    ││  Y2    │ │  Y3    │ │  Y4    │      │
   └────────┘└────────┘ └────────┘ └────────┘      │
       │         │           │           │         │
       └─────────┴───────────┴───────────┘         │
                       │                            │
                  All-Gather                        │
                       │                            │
                       ▼                            │
              ┌───────────────┐                     │
              │ Y = [Y1|Y2|Y3|Y4]                   │
              └───────────────┘                     │
```

### Megatron-LM 风格的张量并行

```python
import torch
import torch.nn as nn
import torch.distributed as dist

class ColumnParallelLinear(nn.Module):
    """列并行线性层"""

    def __init__(self, input_size, output_size, world_size, rank):
        super().__init__()
        self.input_size = input_size
        self.output_size = output_size
        self.world_size = world_size
        self.rank = rank

        # 每个 GPU 只持有一部分列
        assert output_size % world_size == 0
        self.output_size_per_partition = output_size // world_size

        self.weight = nn.Parameter(
            torch.empty(self.output_size_per_partition, input_size)
        )
        self.bias = nn.Parameter(
            torch.empty(self.output_size_per_partition)
        )

        # 初始化
        nn.init.kaiming_uniform_(self.weight)
        nn.init.zeros_(self.bias)

    def forward(self, x):
        # 本地计算
        output = torch.matmul(x, self.weight.t()) + self.bias
        return output

class RowParallelLinear(nn.Module):
    """行并行线性层"""

    def __init__(self, input_size, output_size, world_size, rank):
        super().__init__()
        self.input_size = input_size
        self.output_size = output_size
        self.world_size = world_size
        self.rank = rank

        # 每个 GPU 只持有一部分行
        assert input_size % world_size == 0
        self.input_size_per_partition = input_size // world_size

        self.weight = nn.Parameter(
            torch.empty(output_size, self.input_size_per_partition)
        )
        self.bias = nn.Parameter(torch.empty(output_size)) if rank == 0 else None

        nn.init.kaiming_uniform_(self.weight)
        if self.bias is not None:
            nn.init.zeros_(self.bias)

    def forward(self, x):
        # x 已经是分片的输入
        output = torch.matmul(x, self.weight.t())

        # All-reduce 聚合结果
        dist.all_reduce(output, op=dist.ReduceOp.SUM)

        if self.bias is not None:
            output = output + self.bias

        return output

class TensorParallelMLP(nn.Module):
    """张量并行 MLP"""

    def __init__(self, hidden_size, ffn_hidden_size, world_size, rank):
        super().__init__()

        # 第一层使用列并行
        self.fc1 = ColumnParallelLinear(
            hidden_size, ffn_hidden_size, world_size, rank
        )

        # 第二层使用行并行
        self.fc2 = RowParallelLinear(
            ffn_hidden_size, hidden_size, world_size, rank
        )

        self.activation = nn.GELU()

    def forward(self, x):
        x = self.fc1(x)
        x = self.activation(x)
        x = self.fc2(x)
        return x
```

### 注意力层的张量并行

```python
class TensorParallelAttention(nn.Module):
    """张量并行多头注意力"""

    def __init__(self, hidden_size, num_heads, world_size, rank):
        super().__init__()
        self.hidden_size = hidden_size
        self.num_heads = num_heads
        self.world_size = world_size
        self.rank = rank

        assert num_heads % world_size == 0
        self.num_heads_per_partition = num_heads // world_size
        self.head_dim = hidden_size // num_heads

        # Q, K, V 投影使用列并行
        self.q_proj = ColumnParallelLinear(
            hidden_size, hidden_size, world_size, rank
        )
        self.k_proj = ColumnParallelLinear(
            hidden_size, hidden_size, world_size, rank
        )
        self.v_proj = ColumnParallelLinear(
            hidden_size, hidden_size, world_size, rank
        )

        # 输出投影使用行并行
        self.o_proj = RowParallelLinear(
            hidden_size, hidden_size, world_size, rank
        )

        self.scale = self.head_dim ** -0.5

    def forward(self, hidden_states, attention_mask=None):
        batch_size, seq_len, _ = hidden_states.shape

        # 计算 Q, K, V
        q = self.q_proj(hidden_states)
        k = self.k_proj(hidden_states)
        v = self.v_proj(hidden_states)

        # 重塑为多头格式
        q = q.view(batch_size, seq_len, self.num_heads_per_partition, self.head_dim)
        k = k.view(batch_size, seq_len, self.num_heads_per_partition, self.head_dim)
        v = v.view(batch_size, seq_len, self.num_heads_per_partition, self.head_dim)

        # 转置为 [batch, heads, seq, head_dim]
        q = q.transpose(1, 2)
        k = k.transpose(1, 2)
        v = v.transpose(1, 2)

        # 计算注意力分数
        attn_weights = torch.matmul(q, k.transpose(-2, -1)) * self.scale

        if attention_mask is not None:
            attn_weights = attn_weights + attention_mask

        attn_weights = torch.softmax(attn_weights, dim=-1)

        # 应用注意力到 V
        attn_output = torch.matmul(attn_weights, v)

        # 重塑回原始维度
        attn_output = attn_output.transpose(1, 2).contiguous()
        attn_output = attn_output.view(batch_size, seq_len, -1)

        # 输出投影
        output = self.o_proj(attn_output)

        return output
```

---

## DeepSpeed 框架详解

DeepSpeed 是微软开发的深度学习优化库，提供了一系列内存优化和分布式训练技术。

### ZeRO 优化器

ZeRO (Zero Redundancy Optimizer) 通过分片存储消除数据并行中的冗余，大幅降低内存占用。

```
ZeRO 各阶段内存优化:

传统数据并行 (每个 GPU):
┌─────────────────────────────────────────────────────┐
│  Model Parameters  │  Gradients  │  Optimizer States │
│       (Ψ)         │     (Ψ)     │       (12Ψ)       │
│                   │             │  (Adam: m, v, p)  │
└─────────────────────────────────────────────────────┘
Total: 16Ψ (假设混合精度)

ZeRO-1 (分片优化器状态):
┌─────────────────────────────────────────────────────┐
│  Model Parameters  │  Gradients  │  Optimizer/N    │
│       (Ψ)         │     (Ψ)     │    (12Ψ/N)      │
└─────────────────────────────────────────────────────┘
Total: 4Ψ + 12Ψ/N

ZeRO-2 (分片优化器状态 + 梯度):
┌─────────────────────────────────────────────────────┐
│  Model Parameters  │  Gradients/N │  Optimizer/N   │
│       (Ψ)         │    (Ψ/N)     │    (12Ψ/N)     │
└─────────────────────────────────────────────────────┘
Total: 2Ψ + 14Ψ/N

ZeRO-3 (分片所有内容):
┌─────────────────────────────────────────────────────┐
│  Parameters/N  │  Gradients/N │  Optimizer/N       │
│    (Ψ/N)      │    (Ψ/N)     │    (12Ψ/N)         │
└─────────────────────────────────────────────────────┘
Total: 16Ψ/N

N = GPU 数量, Ψ = 模型参数量
```

### DeepSpeed 配置文件

```json
{
    "train_batch_size": 32,
    "gradient_accumulation_steps": 4,
    "train_micro_batch_size_per_gpu": 2,

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
        "allgather_partitions": true,
        "allgather_bucket_size": 5e8,
        "overlap_comm": true,
        "reduce_scatter": true,
        "reduce_bucket_size": 5e8,
        "contiguous_gradients": true
    },

    "gradient_clipping": 1.0,
    "wall_clock_breakdown": false
}
```

### DeepSpeed 代码示例

```python
import torch
import torch.nn as nn
import deepspeed
from torch.utils.data import DataLoader, Dataset

class LargeModel(nn.Module):
    """示例大模型"""
    def __init__(self, vocab_size=50000, hidden_size=4096, num_layers=32):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, hidden_size)
        self.layers = nn.ModuleList([
            nn.TransformerEncoderLayer(
                d_model=hidden_size,
                nhead=32,
                dim_feedforward=hidden_size * 4,
                batch_first=True
            )
            for _ in range(num_layers)
        ])
        self.fc = nn.Linear(hidden_size, vocab_size)

    def forward(self, x):
        x = self.embedding(x)
        for layer in self.layers:
            x = layer(x)
        return self.fc(x)

def train_with_deepspeed():
    """使用 DeepSpeed 训练"""

    # 1. 创建模型
    model = LargeModel()

    # 2. 准备数据
    class DummyDataset(Dataset):
        def __init__(self, size=10000, seq_len=512):
            self.size = size
            self.seq_len = seq_len

        def __len__(self):
            return self.size

        def __getitem__(self, idx):
            return {
                'input_ids': torch.randint(0, 50000, (self.seq_len,)),
                'labels': torch.randint(0, 50000, (self.seq_len,))
            }

    dataset = DummyDataset()

    # 3. 初始化 DeepSpeed
    # 使用命令行参数或配置文件
    model_engine, optimizer, train_loader, lr_scheduler = deepspeed.initialize(
        model=model,
        model_parameters=model.parameters(),
        training_data=dataset,
        config="ds_config.json"  # DeepSpeed 配置文件
    )

    # 4. 训练循环
    model_engine.train()

    for epoch in range(10):
        for step, batch in enumerate(train_loader):
            input_ids = batch['input_ids'].to(model_engine.device)
            labels = batch['labels'].to(model_engine.device)

            # 前向传播
            outputs = model_engine(input_ids)
            loss = nn.functional.cross_entropy(
                outputs.view(-1, outputs.size(-1)),
                labels.view(-1)
            )

            # 反向传播（DeepSpeed 自动处理）
            model_engine.backward(loss)

            # 参数更新（DeepSpeed 自动处理梯度累积）
            model_engine.step()

            if step % 100 == 0:
                print(f"Epoch {epoch}, Step {step}, Loss: {loss.item():.4f}")

    # 5. 保存模型
    model_engine.save_checkpoint("checkpoints", tag="final")

if __name__ == "__main__":
    train_with_deepspeed()
```

### ZeRO-3 与模型分片

```python
import deepspeed
import torch

# ZeRO-3 配置
ds_config = {
    "zero_optimization": {
        "stage": 3,
        "offload_param": {
            "device": "cpu",
            "pin_memory": True
        },
        "offload_optimizer": {
            "device": "cpu",
            "pin_memory": True
        },
        "overlap_comm": True,
        "contiguous_gradients": True,
        "sub_group_size": 1e9,
        "reduce_bucket_size": "auto",
        "stage3_prefetch_bucket_size": "auto",
        "stage3_param_persistence_threshold": "auto",
        "stage3_max_live_parameters": 1e9,
        "stage3_max_reuse_distance": 1e9,
        "stage3_gather_16bit_weights_on_model_save": True
    },
    "bf16": {
        "enabled": True
    },
    "train_micro_batch_size_per_gpu": 1,
    "gradient_accumulation_steps": 16,
    "gradient_clipping": 1.0
}

# 使用 ZeRO-3 进行推理
def inference_with_zero3(model, tokenizer, prompt):
    """ZeRO-3 推理示例"""
    # 在 ZeRO-3 中，需要收集分片的参数
    with deepspeed.zero.GatheredParameters(
        model.parameters(),
        modifier_rank=0
    ):
        inputs = tokenizer(prompt, return_tensors="pt")
        inputs = {k: v.to(model.device) for k, v in inputs.items()}

        with torch.no_grad():
            outputs = model.generate(**inputs, max_length=100)

        return tokenizer.decode(outputs[0], skip_special_tokens=True)
```

### DeepSpeed ZeRO-Infinity

ZeRO-Infinity 通过 NVMe 卸载实现超大规模模型训练：

```python
ds_config_infinity = {
    "zero_optimization": {
        "stage": 3,
        "offload_param": {
            "device": "nvme",
            "nvme_path": "/local_nvme",
            "pin_memory": True,
            "buffer_count": 5,
            "buffer_size": 1e9
        },
        "offload_optimizer": {
            "device": "nvme",
            "nvme_path": "/local_nvme",
            "pin_memory": True,
            "buffer_count": 4,
            "fast_init": False
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

---

## PyTorch FSDP 详解

FSDP (Fully Sharded Data Parallel) 是 PyTorch 原生的 ZeRO-3 实现，提供了完全分片的数据并行能力。

### FSDP 原理

```
FSDP 工作流程:

Forward Pass:
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: All-gather 收集完整参数                                  │
│                                                                  │
│   GPU 0: [P0/4]  ──┐                                            │
│   GPU 1: [P1/4]  ──┼──► All-gather ──► [P0, P1, P2, P3] (完整)  │
│   GPU 2: [P2/4]  ──┤                                            │
│   GPU 3: [P3/4]  ──┘                                            │
│                                                                  │
│ Step 2: 执行前向计算                                             │
│ Step 3: 释放非本地参数分片（节省显存）                            │
└─────────────────────────────────────────────────────────────────┘

Backward Pass:
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: All-gather 收集完整参数                                  │
│ Step 2: 执行反向计算，生成梯度                                    │
│ Step 3: Reduce-scatter 分片梯度                                  │
│                                                                  │
│   GPU 0: [G_full] ──┐                                           │
│   GPU 1: [G_full] ──┼──► Reduce-scatter ──► GPU 0: [G0/4]       │
│   GPU 2: [G_full] ──┤                      GPU 1: [G1/4]        │
│   GPU 3: [G_full] ──┘                      GPU 2: [G2/4]        │
│                                            GPU 3: [G3/4]        │
│                                                                  │
│ Step 4: 释放非本地参数分片                                       │
│ Step 5: 使用本地梯度分片更新本地参数分片                          │
└─────────────────────────────────────────────────────────────────┘
```

### FSDP 基础用法

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
    size_based_auto_wrap_policy,
    transformer_auto_wrap_policy
)
import functools

def setup_fsdp(rank, world_size):
    """设置 FSDP 环境"""
    dist.init_process_group("nccl", rank=rank, world_size=world_size)
    torch.cuda.set_device(rank)

class TransformerBlock(nn.Module):
    """Transformer 块，作为 FSDP 的包装单元"""
    def __init__(self, hidden_size, num_heads, ffn_size):
        super().__init__()
        self.attention = nn.MultiheadAttention(hidden_size, num_heads, batch_first=True)
        self.ffn = nn.Sequential(
            nn.Linear(hidden_size, ffn_size),
            nn.GELU(),
            nn.Linear(ffn_size, hidden_size)
        )
        self.norm1 = nn.LayerNorm(hidden_size)
        self.norm2 = nn.LayerNorm(hidden_size)

    def forward(self, x, mask=None):
        # 自注意力
        attn_out, _ = self.attention(x, x, x, attn_mask=mask)
        x = self.norm1(x + attn_out)
        # FFN
        ffn_out = self.ffn(x)
        x = self.norm2(x + ffn_out)
        return x

class LargeTransformer(nn.Module):
    """大型 Transformer 模型"""
    def __init__(self, vocab_size, hidden_size, num_layers, num_heads, ffn_size):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, hidden_size)
        self.layers = nn.ModuleList([
            TransformerBlock(hidden_size, num_heads, ffn_size)
            for _ in range(num_layers)
        ])
        self.fc = nn.Linear(hidden_size, vocab_size)

    def forward(self, x):
        x = self.embedding(x)
        for layer in self.layers:
            x = layer(x)
        return self.fc(x)

def train_with_fsdp(rank, world_size):
    """使用 FSDP 训练"""
    setup_fsdp(rank, world_size)

    # 创建模型
    model = LargeTransformer(
        vocab_size=50000,
        hidden_size=4096,
        num_layers=32,
        num_heads=32,
        ffn_size=16384
    )

    # 定义混合精度策略
    mixed_precision_policy = MixedPrecision(
        param_dtype=torch.bfloat16,
        reduce_dtype=torch.bfloat16,
        buffer_dtype=torch.bfloat16
    )

    # 定义自动包装策略
    # 方法1: 基于大小的自动包装
    auto_wrap_policy = functools.partial(
        size_based_auto_wrap_policy,
        min_num_params=1e8  # 参数量超过 1 亿的模块会被包装
    )

    # 方法2: 基于 Transformer 层的包装（推荐）
    transformer_wrap_policy = functools.partial(
        transformer_auto_wrap_policy,
        transformer_layer_cls={TransformerBlock}
    )

    # 用 FSDP 包装模型
    model = FSDP(
        model,
        auto_wrap_policy=transformer_wrap_policy,
        mixed_precision=mixed_precision_policy,
        sharding_strategy=ShardingStrategy.FULL_SHARD,  # ZeRO-3
        cpu_offload=CPUOffload(offload_params=False),
        backward_prefetch=BackwardPrefetch.BACKWARD_PRE,
        device_id=rank,
        use_orig_params=True  # 允许使用原始参数名
    )

    # 创建优化器
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4)

    # 创建数据
    batch_size = 4
    seq_len = 512

    # 训练循环
    model.train()
    for step in range(1000):
        # 生成随机数据
        input_ids = torch.randint(0, 50000, (batch_size, seq_len)).cuda(rank)
        labels = torch.randint(0, 50000, (batch_size, seq_len)).cuda(rank)

        # 前向传播
        outputs = model(input_ids)
        loss = nn.functional.cross_entropy(
            outputs.view(-1, outputs.size(-1)),
            labels.view(-1)
        )

        # 反向传播
        loss.backward()

        # 梯度裁剪
        model.clip_grad_norm_(1.0)

        # 参数更新
        optimizer.step()
        optimizer.zero_grad()

        if step % 100 == 0 and rank == 0:
            print(f"Step {step}, Loss: {loss.item():.4f}")

    dist.destroy_process_group()

if __name__ == "__main__":
    world_size = torch.cuda.device_count()
    torch.multiprocessing.spawn(
        train_with_fsdp,
        args=(world_size,),
        nprocs=world_size,
        join=True
    )
```

### FSDP 高级配置

```python
from torch.distributed.fsdp import (
    StateDictType,
    FullStateDictConfig,
    ShardedStateDictConfig
)

def save_fsdp_checkpoint(model, optimizer, path, rank):
    """保存 FSDP 检查点"""

    # 方法1: 保存完整状态字典（需要收集所有分片）
    full_state_dict_config = FullStateDictConfig(
        offload_to_cpu=True,
        rank0_only=True
    )

    with FSDP.state_dict_type(
        model,
        StateDictType.FULL_STATE_DICT,
        full_state_dict_config
    ):
        state_dict = model.state_dict()
        if rank == 0:
            torch.save(state_dict, f"{path}/model.pt")

    # 方法2: 保存分片状态字典（推荐，更快更省内存）
    sharded_state_dict_config = ShardedStateDictConfig(
        offload_to_cpu=True
    )

    with FSDP.state_dict_type(
        model,
        StateDictType.SHARDED_STATE_DICT,
        sharded_state_dict_config
    ):
        state_dict = model.state_dict()
        # 使用 torch.distributed.checkpoint 保存
        import torch.distributed.checkpoint as dcp
        dcp.save_state_dict(
            state_dict={"model": state_dict},
            storage_writer=dcp.FileSystemWriter(path)
        )

def load_fsdp_checkpoint(model, path):
    """加载 FSDP 检查点"""
    import torch.distributed.checkpoint as dcp

    with FSDP.state_dict_type(model, StateDictType.SHARDED_STATE_DICT):
        state_dict = {"model": model.state_dict()}
        dcp.load_state_dict(
            state_dict=state_dict,
            storage_reader=dcp.FileSystemReader(path)
        )
        model.load_state_dict(state_dict["model"])

# FSDP 分片策略对比
class ShardingStrategies:
    """FSDP 分片策略"""

    # FULL_SHARD: 完全分片（ZeRO-3）
    # - 分片参数、梯度、优化器状态
    # - 最省显存，通信开销最大
    FULL_SHARD = ShardingStrategy.FULL_SHARD

    # SHARD_GRAD_OP: 分片梯度和优化器（ZeRO-2）
    # - 参数完整复制，分片梯度和优化器状态
    # - 显存占用适中，通信开销适中
    SHARD_GRAD_OP = ShardingStrategy.SHARD_GRAD_OP

    # NO_SHARD: 不分片（DDP）
    # - 等同于普通 DDP
    # - 显存占用最大，通信开销最小
    NO_SHARD = ShardingStrategy.NO_SHARD

    # HYBRID_SHARD: 混合分片
    # - 节点内完全分片，节点间复制
    # - 平衡显存和通信
    HYBRID_SHARD = ShardingStrategy.HYBRID_SHARD
```

### FSDP 与激活检查点

```python
from torch.distributed.algorithms._checkpoint.checkpoint_wrapper import (
    checkpoint_wrapper,
    CheckpointImpl,
    apply_activation_checkpointing
)

def apply_fsdp_with_activation_checkpointing(model):
    """应用 FSDP 和激活检查点"""

    # 定义哪些层需要应用激活检查点
    check_fn = lambda submodule: isinstance(submodule, TransformerBlock)

    # 应用激活检查点
    apply_activation_checkpointing(
        model,
        checkpoint_wrapper_fn=checkpoint_wrapper,
        check_fn=check_fn
    )

    # 然后用 FSDP 包装
    model = FSDP(
        model,
        auto_wrap_policy=functools.partial(
            transformer_auto_wrap_policy,
            transformer_layer_cls={TransformerBlock}
        ),
        mixed_precision=MixedPrecision(
            param_dtype=torch.bfloat16,
            reduce_dtype=torch.bfloat16,
            buffer_dtype=torch.bfloat16
        )
    )

    return model
```

---

## 混合并行策略

实际训练大模型时，通常需要组合多种并行策略。

### 3D 并行

```
3D 并行架构 (Data + Tensor + Pipeline):

                    数据并行 (DP)
         ┌─────────────────────────────────────────┐
         │                                         │
         │   DP Group 0         DP Group 1        │
         │   ┌─────────┐       ┌─────────┐        │
         │   │         │       │         │        │
         │   │ Stage 0 │       │ Stage 0 │        │
         │   │ TP 0-3  │       │ TP 0-3  │        │
         │   │         │       │         │        │
 流      │   └────┬────┘       └────┬────┘        │
 水      │        │                 │             │
 线      │        ▼                 ▼             │
 并      │   ┌─────────┐       ┌─────────┐        │
 行      │   │         │       │         │        │
 (PP)    │   │ Stage 1 │       │ Stage 1 │        │
         │   │ TP 0-3  │       │ TP 0-3  │        │
         │   │         │       │         │        │
         │   └────┬────┘       └────┬────┘        │
         │        │                 │             │
         │        ▼                 ▼             │
         │   ┌─────────┐       ┌─────────┐        │
         │   │         │       │         │        │
         │   │ Stage 2 │       │ Stage 2 │        │
         │   │ TP 0-3  │       │ TP 0-3  │        │
         │   │         │       │         │        │
         │   └─────────┘       └─────────┘        │
         │                                         │
         │       ◄── 张量并行 (TP) ──►             │
         │                                         │
         └─────────────────────────────────────────┘

每个 Stage 内部的 4 个 GPU 使用张量并行
Stage 之间使用流水线并行
相同 Stage 的不同 DP Group 使用数据并行
```

### Megatron-DeepSpeed 配置示例

```python
import torch
import deepspeed
from megatron import get_args
from megatron.core import parallel_state

def initialize_3d_parallel(
    tensor_model_parallel_size: int = 4,
    pipeline_model_parallel_size: int = 4,
    data_parallel_size: int = 2
):
    """初始化 3D 并行"""

    # 总 GPU 数 = TP * PP * DP
    world_size = tensor_model_parallel_size * pipeline_model_parallel_size * data_parallel_size

    # 初始化分布式
    torch.distributed.init_process_group(backend='nccl')
    rank = torch.distributed.get_rank()

    # 初始化 Megatron 并行状态
    parallel_state.initialize_model_parallel(
        tensor_model_parallel_size=tensor_model_parallel_size,
        pipeline_model_parallel_size=pipeline_model_parallel_size
    )

    # 获取各种并行组
    tp_group = parallel_state.get_tensor_model_parallel_group()
    pp_group = parallel_state.get_pipeline_model_parallel_group()
    dp_group = parallel_state.get_data_parallel_group()

    # 获取各维度的 rank
    tp_rank = parallel_state.get_tensor_model_parallel_rank()
    pp_rank = parallel_state.get_pipeline_model_parallel_rank()
    dp_rank = parallel_state.get_data_parallel_rank()

    print(f"Global Rank: {rank}")
    print(f"  - Tensor Parallel Rank: {tp_rank}")
    print(f"  - Pipeline Parallel Rank: {pp_rank}")
    print(f"  - Data Parallel Rank: {dp_rank}")

    return tp_group, pp_group, dp_group

# 3D 并行训练配置
training_config = {
    "tensor_model_parallel_size": 4,
    "pipeline_model_parallel_size": 4,
    "data_parallel_size": 2,

    # 每个数据并行组的 micro batch 数量
    "num_micro_batches": 8,

    # 全局 batch size = micro_batch_size * num_micro_batches * data_parallel_size
    "micro_batch_size": 1,

    # 序列长度
    "seq_length": 2048,

    # 模型配置
    "hidden_size": 12288,
    "num_attention_heads": 96,
    "num_layers": 96,  # 会被流水线并行分割
    "vocab_size": 50257
}
```

### 使用 Hugging Face Accelerate

```python
from accelerate import Accelerator
from accelerate.utils import DeepSpeedPlugin
import torch
from torch.utils.data import DataLoader
from transformers import AutoModelForCausalLM, AutoTokenizer

def train_with_accelerate():
    """使用 Accelerate 进行分布式训练"""

    # 配置 DeepSpeed
    deepspeed_plugin = DeepSpeedPlugin(
        gradient_accumulation_steps=4,
        gradient_clipping=1.0,
        zero_stage=2,
        offload_optimizer_device="cpu",
        offload_param_device="cpu"
    )

    # 初始化 Accelerator
    accelerator = Accelerator(
        mixed_precision="bf16",
        deepspeed_plugin=deepspeed_plugin
    )

    # 加载模型
    model = AutoModelForCausalLM.from_pretrained(
        "meta-llama/Llama-2-7b-hf",
        torch_dtype=torch.bfloat16
    )
    tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-2-7b-hf")

    # 创建数据加载器
    # ... (数据准备代码)

    # 创建优化器
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-5)

    # 使用 Accelerator 准备
    model, optimizer, train_loader = accelerator.prepare(
        model, optimizer, train_loader
    )

    # 训练循环
    model.train()
    for epoch in range(3):
        for batch in train_loader:
            outputs = model(**batch)
            loss = outputs.loss

            accelerator.backward(loss)
            optimizer.step()
            optimizer.zero_grad()

            if accelerator.is_main_process:
                accelerator.print(f"Loss: {loss.item():.4f}")

    # 保存模型
    accelerator.wait_for_everyone()
    unwrapped_model = accelerator.unwrap_model(model)
    accelerator.save(unwrapped_model.state_dict(), "model.pt")
```

---

## 通信优化

### 通信与计算重叠

```python
import torch
import torch.distributed as dist
from torch.cuda import Stream

class OverlappedAllReduce:
    """重叠通信与计算的 All-Reduce 实现"""

    def __init__(self):
        self.comm_stream = Stream()

    def allreduce_async(self, tensor):
        """异步 All-Reduce"""
        with torch.cuda.stream(self.comm_stream):
            work = dist.all_reduce(tensor, async_op=True)
        return work

    def wait(self, work):
        """等待通信完成"""
        self.comm_stream.synchronize()
        work.wait()

def train_step_with_overlap(model, optimizer, data, target, overlapped_ar):
    """带通信重叠的训练步骤"""

    # 前向传播
    output = model(data)
    loss = torch.nn.functional.cross_entropy(output, target)

    # 反向传播
    loss.backward()

    # 收集所有需要同步的梯度
    grads = []
    works = []

    for param in model.parameters():
        if param.grad is not None:
            grads.append(param.grad)
            # 启动异步 All-Reduce
            work = overlapped_ar.allreduce_async(param.grad)
            works.append(work)

    # 在等待通信时可以做其他计算
    # ... 例如计算指标、日志等

    # 等待所有通信完成
    for work in works:
        overlapped_ar.wait(work)

    # 参数更新
    optimizer.step()
    optimizer.zero_grad()

    return loss.item()
```

### Ring All-Reduce 详解

```
Ring All-Reduce 算法:

假设有 4 个 GPU，每个 GPU 有数据 [A, B, C, D]

步骤 1: Reduce-Scatter 阶段
每个 GPU 发送一块数据给下一个 GPU，同时接收上一个 GPU 的数据并累加

Round 1:
GPU 0: [A0] ──► GPU 1     GPU 3 ──► GPU 0: [A0+A3]
GPU 1: [B1] ──► GPU 2     GPU 0 ──► GPU 1: [B1+B0]
GPU 2: [C2] ──► GPU 3     GPU 1 ──► GPU 2: [C2+C1]
GPU 3: [D3] ──► GPU 0     GPU 2 ──► GPU 3: [D3+D2]

Round 2:
GPU 0: [D0+D3] ──► GPU 1     GPU 3 ──► GPU 0: [A0+A3+A2]
...

Round 3:
...

经过 N-1 轮后，每个 GPU 持有一块完整的归约结果

步骤 2: All-Gather 阶段
每个 GPU 发送自己的完整块给下一个 GPU

最终每个 GPU 都有完整的归约结果 [A_sum, B_sum, C_sum, D_sum]

通信量: 2 * (N-1) / N * data_size ≈ 2 * data_size
```

```python
def ring_allreduce(tensor, world_size, rank):
    """Ring All-Reduce 的简化实现"""
    # 将 tensor 分成 world_size 块
    chunks = list(tensor.chunk(world_size))

    # Reduce-Scatter 阶段
    for i in range(world_size - 1):
        send_idx = (rank - i) % world_size
        recv_idx = (rank - i - 1) % world_size

        send_chunk = chunks[send_idx].clone()
        recv_chunk = torch.zeros_like(chunks[recv_idx])

        # 发送和接收
        next_rank = (rank + 1) % world_size
        prev_rank = (rank - 1 + world_size) % world_size

        send_op = dist.isend(send_chunk, next_rank)
        recv_op = dist.irecv(recv_chunk, prev_rank)

        send_op.wait()
        recv_op.wait()

        # 累加
        chunks[recv_idx] += recv_chunk

    # All-Gather 阶段
    for i in range(world_size - 1):
        send_idx = (rank - i + 1) % world_size
        recv_idx = (rank - i) % world_size

        send_chunk = chunks[send_idx].clone()
        recv_chunk = torch.zeros_like(chunks[recv_idx])

        next_rank = (rank + 1) % world_size
        prev_rank = (rank - 1 + world_size) % world_size

        send_op = dist.isend(send_chunk, next_rank)
        recv_op = dist.irecv(recv_chunk, prev_rank)

        send_op.wait()
        recv_op.wait()

        chunks[recv_idx] = recv_chunk

    # 重组结果
    return torch.cat(chunks)
```

### 梯度压缩技术

```python
import torch
import torch.distributed as dist

class TopKCompressor:
    """Top-K 梯度压缩"""

    def __init__(self, compress_ratio=0.01):
        self.compress_ratio = compress_ratio
        self.residuals = {}

    def compress(self, tensor, name):
        """压缩梯度"""
        # 添加残差
        if name in self.residuals:
            tensor = tensor + self.residuals[name]

        # 计算 k
        numel = tensor.numel()
        k = max(1, int(numel * self.compress_ratio))

        # 获取 Top-K
        values, indices = torch.topk(tensor.abs().view(-1), k)
        values = tensor.view(-1)[indices]

        # 保存残差
        residual = tensor.clone()
        residual.view(-1)[indices] = 0
        self.residuals[name] = residual

        return values, indices, tensor.shape

    def decompress(self, values, indices, shape):
        """解压梯度"""
        tensor = torch.zeros(shape).view(-1)
        tensor[indices] = values
        return tensor.view(shape)

class ErrorFeedbackSGD:
    """带误差反馈的压缩 SGD"""

    def __init__(self, params, lr, compressor):
        self.params = list(params)
        self.lr = lr
        self.compressor = compressor

    def step(self):
        for i, param in enumerate(self.params):
            if param.grad is None:
                continue

            # 压缩梯度
            values, indices, shape = self.compressor.compress(
                param.grad, f"param_{i}"
            )

            # All-Reduce 压缩后的梯度
            dist.all_reduce(values)

            # 解压并更新
            grad = self.compressor.decompress(values, indices, shape)
            param.data -= self.lr * grad
```

---

## 实战案例

### 案例 1: 使用 DeepSpeed 训练 LLaMA

```python
import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling
)
from datasets import load_dataset
import deepspeed

def train_llama_with_deepspeed():
    """使用 DeepSpeed 训练 LLaMA"""

    # 加载模型和分词器
    model_name = "meta-llama/Llama-2-7b-hf"
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype=torch.bfloat16
    )

    # 加载数据集
    dataset = load_dataset("tatsu-lab/alpaca", split="train")

    def tokenize_function(examples):
        return tokenizer(
            examples["text"],
            truncation=True,
            max_length=2048,
            padding="max_length"
        )

    tokenized_dataset = dataset.map(tokenize_function, batched=True)

    # DeepSpeed 配置
    ds_config = {
        "bf16": {"enabled": True},
        "zero_optimization": {
            "stage": 3,
            "offload_optimizer": {"device": "cpu"},
            "offload_param": {"device": "cpu"},
            "overlap_comm": True,
            "contiguous_gradients": True,
            "reduce_bucket_size": "auto",
            "stage3_prefetch_bucket_size": "auto",
            "stage3_param_persistence_threshold": "auto"
        },
        "gradient_accumulation_steps": 8,
        "gradient_clipping": 1.0,
        "train_batch_size": "auto",
        "train_micro_batch_size_per_gpu": 1
    }

    # 训练参数
    training_args = TrainingArguments(
        output_dir="./llama-finetuned",
        num_train_epochs=3,
        per_device_train_batch_size=1,
        gradient_accumulation_steps=8,
        learning_rate=2e-5,
        weight_decay=0.01,
        warmup_ratio=0.03,
        lr_scheduler_type="cosine",
        logging_steps=10,
        save_strategy="epoch",
        bf16=True,
        deepspeed=ds_config,
        gradient_checkpointing=True
    )

    # 创建 Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_dataset,
        data_collator=DataCollatorForLanguageModeling(tokenizer, mlm=False)
    )

    # 开始训练
    trainer.train()

    # 保存模型
    trainer.save_model()

if __name__ == "__main__":
    train_llama_with_deepspeed()
```

### 案例 2: 多节点 FSDP 训练

```python
import os
import torch
import torch.distributed as dist
from torch.distributed.fsdp import FullyShardedDataParallel as FSDP
from torch.distributed.fsdp import ShardingStrategy, MixedPrecision
from torch.distributed.fsdp.wrap import transformer_auto_wrap_policy
from transformers import AutoModelForCausalLM, AutoTokenizer
import functools

def setup_distributed():
    """设置多节点分布式环境"""
    # 从环境变量获取配置（由 torchrun 或 SLURM 设置）
    rank = int(os.environ["RANK"])
    local_rank = int(os.environ["LOCAL_RANK"])
    world_size = int(os.environ["WORLD_SIZE"])

    # 初始化进程组
    dist.init_process_group(backend="nccl")
    torch.cuda.set_device(local_rank)

    return rank, local_rank, world_size

def train_multi_node():
    """多节点 FSDP 训练"""
    rank, local_rank, world_size = setup_distributed()

    # 加载模型
    model = AutoModelForCausalLM.from_pretrained(
        "meta-llama/Llama-2-13b-hf",
        torch_dtype=torch.bfloat16
    )

    # 获取 Transformer 层类
    from transformers.models.llama.modeling_llama import LlamaDecoderLayer

    # 配置 FSDP
    mixed_precision = MixedPrecision(
        param_dtype=torch.bfloat16,
        reduce_dtype=torch.bfloat16,
        buffer_dtype=torch.bfloat16
    )

    wrap_policy = functools.partial(
        transformer_auto_wrap_policy,
        transformer_layer_cls={LlamaDecoderLayer}
    )

    model = FSDP(
        model,
        auto_wrap_policy=wrap_policy,
        mixed_precision=mixed_precision,
        sharding_strategy=ShardingStrategy.FULL_SHARD,
        device_id=local_rank,
        use_orig_params=True
    )

    # 创建优化器
    optimizer = torch.optim.AdamW(
        model.parameters(),
        lr=1e-5,
        weight_decay=0.01
    )

    # 学习率调度器
    from torch.optim.lr_scheduler import CosineAnnealingLR
    scheduler = CosineAnnealingLR(optimizer, T_max=1000)

    # 训练循环
    model.train()
    for step in range(1000):
        # 生成随机数据（实际应用中使用真实数据）
        input_ids = torch.randint(0, 32000, (2, 2048)).cuda()
        labels = input_ids.clone()

        # 前向传播
        outputs = model(input_ids=input_ids, labels=labels)
        loss = outputs.loss

        # 反向传播
        loss.backward()

        # 梯度裁剪
        model.clip_grad_norm_(1.0)

        # 参数更新
        optimizer.step()
        scheduler.step()
        optimizer.zero_grad()

        # 日志
        if step % 10 == 0 and rank == 0:
            print(f"Step {step}, Loss: {loss.item():.4f}, LR: {scheduler.get_last_lr()[0]:.6f}")

    # 保存检查点
    if rank == 0:
        # 收集完整模型状态
        from torch.distributed.fsdp import FullStateDictConfig, StateDictType

        full_state_dict_config = FullStateDictConfig(
            offload_to_cpu=True,
            rank0_only=True
        )

        with FSDP.state_dict_type(
            model,
            StateDictType.FULL_STATE_DICT,
            full_state_dict_config
        ):
            state_dict = model.state_dict()
            torch.save(state_dict, "model_checkpoint.pt")

    dist.destroy_process_group()

if __name__ == "__main__":
    train_multi_node()
```

### 启动脚本

```bash
#!/bin/bash
# launch_training.sh

# 单节点多卡
torchrun --nproc_per_node=8 \
    train.py

# 多节点训练 (使用 torchrun)
# 节点 0
torchrun --nnodes=2 \
    --node_rank=0 \
    --nproc_per_node=8 \
    --master_addr="192.168.1.1" \
    --master_port=29500 \
    train.py

# 节点 1
torchrun --nnodes=2 \
    --node_rank=1 \
    --nproc_per_node=8 \
    --master_addr="192.168.1.1" \
    --master_port=29500 \
    train.py

# 使用 SLURM
srun --nodes=4 \
    --ntasks-per-node=8 \
    --gpus-per-node=8 \
    python -m torch.distributed.run \
    --nnodes=4 \
    --nproc_per_node=8 \
    train.py
```

---

## 面试要点

### 核心概念题

**Q1: 数据并行和模型并行的主要区别是什么？各自的适用场景？**

**数据并行 (Data Parallelism):**
- 每个 GPU 持有完整模型副本
- 数据被分割到不同 GPU
- 梯度需要 All-Reduce 同步
- 适用场景：模型能放入单卡显存，需要加速训练

**模型并行 (Model Parallelism):**
- 模型被分割到多个 GPU
- 每个 GPU 只持有部分模型
- 需要在 GPU 间传递激活值
- 适用场景：模型太大无法放入单卡

**Q2: 解释 ZeRO 的三个阶段及其显存优化原理？**

```python
# ZeRO 三阶段内存占用（混合精度训练，模型参数量为 Ψ）

# 传统数据并行：每个 GPU 占用 16Ψ
# - 参数 (FP16): 2Ψ
# - 梯度 (FP16): 2Ψ
# - 优化器状态 (FP32 参数副本 + 动量 + 方差): 4Ψ + 4Ψ + 4Ψ = 12Ψ

# ZeRO-1: 分片优化器状态
# - 参数: 2Ψ, 梯度: 2Ψ, 优化器: 12Ψ/N
# - 总计: 4Ψ + 12Ψ/N

# ZeRO-2: 分片优化器状态 + 梯度
# - 参数: 2Ψ, 梯度: 2Ψ/N, 优化器: 12Ψ/N
# - 总计: 2Ψ + 14Ψ/N

# ZeRO-3: 分片所有内容
# - 参数: 2Ψ/N, 梯度: 2Ψ/N, 优化器: 12Ψ/N
# - 总计: 16Ψ/N
```

**Q3: 流水线并行中的 "气泡" 问题是什么？如何优化？**

"气泡"指的是流水线并行中 GPU 空闲等待的时间。

优化方法：
1. **增加 micro-batch 数量**：减少预热和收尾阶段的占比
2. **使用 1F1B 调度**：交替执行前向和反向，减少气泡
3. **交错流水线**：多个流水线交错执行
4. **虚拟流水线**：将每个阶段进一步细分

**Q4: FSDP 和 DeepSpeed ZeRO-3 的主要区别？**

| 特性 | FSDP | DeepSpeed ZeRO-3 |
|------|------|------------------|
| 集成 | PyTorch 原生 | 独立库 |
| 配置 | Python API | JSON 配置文件 |
| 灵活性 | 更灵活的包装策略 | 更多优化选项 |
| CPU 卸载 | 支持 | 支持（更成熟） |
| NVMe 卸载 | 不支持 | 支持（ZeRO-Infinity） |
| 检查点 | 原生支持 | 需要特殊处理 |

### 工程实践题

**Q5: 如何选择合适的分布式训练策略？**

```python
def choose_distributed_strategy(
    model_size_gb: float,
    gpu_memory_gb: float,
    num_gpus: int,
    num_nodes: int
):
    """选择分布式训练策略"""

    total_gpu_memory = gpu_memory_gb * num_gpus

    if model_size_gb * 16 < gpu_memory_gb:
        # 模型完全能放入单卡
        if num_gpus > 1:
            return "DDP (DistributedDataParallel)"
        else:
            return "单卡训练"

    elif model_size_gb * 16 < total_gpu_memory / 4:
        # 模型需要分片但不太大
        return "FSDP / ZeRO-2"

    elif model_size_gb * 16 < total_gpu_memory:
        # 模型较大
        return "FSDP (FULL_SHARD) / ZeRO-3"

    else:
        # 模型非常大，需要 CPU/NVMe 卸载
        if num_nodes > 1:
            return "3D 并行 (TP + PP + DP) + ZeRO"
        else:
            return "ZeRO-Infinity (CPU/NVMe 卸载)"
```

**Q6: 分布式训练中常见的问题和解决方案？**

1. **梯度爆炸/消失**
   - 解决：梯度裁剪、合适的初始化、学习率预热

2. **训练不稳定**
   - 解决：减小学习率、增加 warmup、使用 BF16 代替 FP16

3. **通信瓶颈**
   - 解决：梯度压缩、通信计算重叠、使用更快的互联

4. **显存不足**
   - 解决：激活检查点、梯度累积、ZeRO 优化

5. **负载不均衡**
   - 解决：动态批量大小、层均衡分配

```python
class DistributedTrainingDebugger:
    """分布式训练调试工具"""

    @staticmethod
    def check_gradient_sync(model, rank):
        """检查梯度是否同步"""
        for name, param in model.named_parameters():
            if param.grad is not None:
                grad_sum = param.grad.sum()
                all_sums = [torch.zeros_like(grad_sum) for _ in range(dist.get_world_size())]
                dist.all_gather(all_sums, grad_sum)

                if rank == 0:
                    if not all(torch.allclose(all_sums[0], s) for s in all_sums):
                        print(f"Warning: Gradient not synced for {name}")

    @staticmethod
    def monitor_memory(rank):
        """监控 GPU 内存"""
        allocated = torch.cuda.memory_allocated() / 1024**3
        reserved = torch.cuda.memory_reserved() / 1024**3
        max_allocated = torch.cuda.max_memory_allocated() / 1024**3

        print(f"Rank {rank}: Allocated={allocated:.2f}GB, "
              f"Reserved={reserved:.2f}GB, Max={max_allocated:.2f}GB")

    @staticmethod
    def measure_throughput(batch_size, seq_len, time_per_step, world_size):
        """计算训练吞吐量"""
        tokens_per_step = batch_size * seq_len * world_size
        tokens_per_second = tokens_per_step / time_per_step
        return tokens_per_second
```

---

## 延伸阅读

### 推荐资源

1. **论文**
   - ZeRO: "ZeRO: Memory Optimizations Toward Training Trillion Parameter Models"
   - Megatron-LM: "Megatron-LM: Training Multi-Billion Parameter Language Models"
   - GPipe: "GPipe: Efficient Training of Giant Neural Networks using Pipeline Parallelism"
   - FSDP: "PyTorch FSDP: Experiences on Scaling Fully Sharded Data Parallel"

2. **官方文档**
   - PyTorch Distributed: https://pytorch.org/docs/stable/distributed.html
   - DeepSpeed: https://www.deepspeed.ai/
   - Megatron-LM: https://github.com/NVIDIA/Megatron-LM

3. **教程**
   - Hugging Face 分布式训练指南
   - NVIDIA Deep Learning Examples

### 进阶主题

- 异步分布式训练
- 联邦学习
- 弹性训练 (Elastic Training)
- 混合专家模型 (MoE) 的分布式训练
- 大模型推理的分布式部署

---

通过本文的学习，你应该能够：
1. 理解各种并行策略的原理和适用场景
2. 使用 DDP、FSDP 和 DeepSpeed 进行分布式训练
3. 根据模型大小和硬件配置选择合适的训练策略
4. 诊断和优化分布式训练中的常见问题
5. 在面试中自信地讨论分布式训练相关话题

分布式训练是一个快速发展的领域，建议持续关注 PyTorch、DeepSpeed 和 Megatron-LM 的最新进展，并通过实践加深理解。
