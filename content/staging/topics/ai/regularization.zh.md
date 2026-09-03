---
title: 深度学习正则化技术
description: 掌握深度学习中的核心正则化技术，包括 Dropout、BatchNorm、LayerNorm、数据增强和 Mixup，并附带实用的 PyTorch 实现
track: ai
section: deep-learning
difficulty: intermediate
tags:
  - 深度学习
  - 正则化
  - dropout
  - 批归一化
  - 层归一化
  - 数据增强
  - mixup
  - PyTorch
status: imported
origin: old/src/content/docs/datascience/regularization.zh.md
divergence: 0.196
issues: []
legacy:
  category: DataScience
  subcategory: DeepLearning
  order: 15
  lastUpdated: 2026-01-07
---

正则化是成功训练深度神经网络最关键的方面之一。如果没有适当的正则化，模型往往会过拟合训练数据，记住无法泛化到未见样本的噪声和特定模式。本综合指南涵盖了每位深度学习从业者都应该掌握的核心正则化技术，并附带理论基础和实用的 PyTorch 实现。

---

## 理解过拟合和正则化

### 过拟合问题

当模型对训练数据学习得过于充分，包括其噪声和异常值时，就会发生过拟合，导致对新数据的泛化能力差。这在深度神经网络中特别常见，因为它们具有高容量和大量参数。

**过拟合的迹象：**
- 训练损失持续下降，而验证损失增加
- 训练和验证准确率之间存在较大差距
- 模型在训练数据上表现优异，但在测试数据上表现不佳

```python
import torch
import torch.nn as nn
import matplotlib.pyplot as plt
import numpy as np

def visualize_overfitting(train_losses, val_losses, train_accs, val_accs):
    """
    可视化训练曲线以识别过拟合。
    训练和验证指标之间的分歧表明过拟合。
    """
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    # 损失曲线
    axes[0].plot(train_losses, label='训练损失', color='blue')
    axes[0].plot(val_losses, label='验证损失', color='red')
    axes[0].set_xlabel('轮次')
    axes[0].set_ylabel('损失')
    axes[0].set_title('损失曲线 - 识别过拟合')
    axes[0].legend()
    axes[0].grid(True, alpha=0.3)

    # 准确率曲线
    axes[1].plot(train_accs, label='训练准确率', color='blue')
    axes[1].plot(val_accs, label='验证准确率', color='red')
    axes[1].set_xlabel('轮次')
    axes[1].set_ylabel('准确率')
    axes[1].set_title('准确率曲线 - 泛化差距')
    axes[1].legend()
    axes[1].grid(True, alpha=0.3)

    plt.tight_layout()
    plt.savefig('overfitting_visualization.png', dpi=150)
    plt.show()
```

### 什么是正则化？

正则化涵盖通过向学习过程添加约束或修改来防止过拟合的技术。目标是提高模型对未见数据的泛化能力。

**正则化类别：**

| 类别 | 技术 | 机制 |
|----------|-----------|-----------|
| 显式正则化 | L1/L2 惩罚、权重衰减 | 向损失函数添加惩罚项 |
| 隐式正则化 | Dropout、早停 | 修改训练过程 |
| 归一化 | BatchNorm、LayerNorm | 归一化激活值 |
| 基于数据 | 增强、Mixup | 扩展有效训练集 |

```python
import torch
import torch.nn as nn

# 示例：L2 正则化（权重衰减）
# 通过优化器应用
optimizer = torch.optim.AdamW(
    model.parameters(),
    lr=0.001,
    weight_decay=0.01  # L2 正则化系数
)

# 手动 L1 正则化
def l1_regularization(model, lambda_l1=1e-5):
    """
    计算 L1 正则化项。
    L1 通过将权重推向精确的零来促进稀疏性。
    """
    l1_penalty = 0
    for param in model.parameters():
        l1_penalty += torch.abs(param).sum()
    return lambda_l1 * l1_penalty

# 组合 L1 和 L2（弹性网络）
def elastic_net_regularization(model, lambda_l1=1e-5, lambda_l2=1e-4):
    """
    弹性网络结合了 L1 和 L2 正则化。
    提供稀疏性（L1）和权重幅度控制（L2）。
    """
    l1_penalty = 0
    l2_penalty = 0
    for param in model.parameters():
        l1_penalty += torch.abs(param).sum()
        l2_penalty += torch.pow(param, 2).sum()
    return lambda_l1 * l1_penalty + lambda_l2 * l2_penalty
```

---

## Dropout

### 理论和直觉

Dropout 是由 Hinton 等人在 2014 年提出的一种强大的正则化技术。在训练期间，dropout 在每次更新时随机将一部分输入单元设置为零，防止单元之间过度共同适应。

**关键见解：**
- 防止神经元之间的复杂共同适应
- 大约等同于训练网络集成
- 迫使网络学习更鲁棒的特征
- 每个神经元必须独立有用

**数学公式：**

在训练期间，对于每次前向传递：
$$y = f\left(\frac{1}{1-p} \cdot m \odot x\right)$$

其中：
- $p$ 是 dropout 概率
- $m$ 是从伯努利($1-p$)采样的二进制掩码
- $\odot$ 表示逐元素乘法
- 缩放因子 $\frac{1}{1-p}$ 确保期望值保持一致

### PyTorch 实现

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class DropoutFromScratch(nn.Module):
    """
    自定义 Dropout 实现以理解其机制。
    在训练期间，以概率 p 随机将元素置零。
    在评估期间，返回未改变的输入。
    """
    def __init__(self, p=0.5):
        super().__init__()
        self.p = p

    def forward(self, x):
        if self.training and self.p > 0:
            # 创建二进制掩码
            mask = torch.bernoulli(torch.ones_like(x) * (1 - self.p))
            # 缩放以保持期望值
            return x * mask / (1 - self.p)
        return x

class MLPWithDropout(nn.Module):
    """
    带有 Dropout 正则化的多层感知器。
    Dropout 在隐藏层的激活函数之后应用。
    """
    def __init__(self, input_dim, hidden_dims, output_dim, dropout_rate=0.5):
        super().__init__()

        layers = []
        prev_dim = input_dim

        for hidden_dim in hidden_dims:
            layers.extend([
                nn.Linear(prev_dim, hidden_dim),
                nn.ReLU(),
                nn.Dropout(dropout_rate)
            ])
            prev_dim = hidden_dim

        # 输出层不使用 dropout
        layers.append(nn.Linear(prev_dim, output_dim))

        self.network = nn.Sequential(*layers)

    def forward(self, x):
        return self.network(x)

# 使用示例
model = MLPWithDropout(
    input_dim=784,
    hidden_dims=[512, 256, 128],
    output_dim=10,
    dropout_rate=0.5
)

# 重要：在推理期间将模型设置为评估模式以禁用 dropout
model.train(False)
with torch.no_grad():
    predictions = model(test_data)
```

### Dropout 变体

```python
class SpatialDropout2d(nn.Module):
    """
    用于 CNN 的空间 Dropout。
    丢弃整个特征图而不是单个元素。
    更适合相邻像素相关的卷积层。
    """
    def __init__(self, p=0.5):
        super().__init__()
        self.dropout = nn.Dropout2d(p)

    def forward(self, x):
        # x 形状：(batch, channels, height, width)
        return self.dropout(x)

class DropConnect(nn.Module):
    """
    DropConnect：丢弃连接（权重）而不是激活。
    比 Dropout 更细粒度的正则化。
    """
    def __init__(self, in_features, out_features, p=0.5):
        super().__init__()
        self.in_features = in_features
        self.out_features = out_features
        self.p = p
        self.weight = nn.Parameter(torch.randn(out_features, in_features))
        self.bias = nn.Parameter(torch.zeros(out_features))

        # 初始化权重
        nn.init.kaiming_uniform_(self.weight)

    def forward(self, x):
        if self.training and self.p > 0:
            # 为权重创建掩码
            mask = torch.bernoulli(
                torch.ones_like(self.weight) * (1 - self.p)
            )
            weight = self.weight * mask / (1 - self.p)
        else:
            weight = self.weight

        return F.linear(x, weight, self.bias)

class AlphaDropout(nn.Module):
    """
    用于自归一化神经网络（SNN）的 Alpha Dropout。
    在 dropout 后保持激活的均值和方差。
    与 SELU 激活函数一起使用。
    """
    def __init__(self, p=0.5):
        super().__init__()
        self.alpha_dropout = nn.AlphaDropout(p)

    def forward(self, x):
        return self.alpha_dropout(x)

class CNNWithSpatialDropout(nn.Module):
    """
    使用空间 Dropout 进行更好正则化的 CNN。
    """
    def __init__(self, num_classes=10, dropout_rate=0.2):
        super().__init__()

        self.features = nn.Sequential(
            # 块 1
            nn.Conv2d(3, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.Conv2d(64, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),
            nn.Dropout2d(dropout_rate),  # 空间 dropout

            # 块 2
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(),
            nn.Conv2d(128, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(),
            nn.MaxPool2d(2, 2),
            nn.Dropout2d(dropout_rate),

            # 块 3
            nn.Conv2d(128, 256, kernel_size=3, padding=1),
            nn.BatchNorm2d(256),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d((1, 1))
        )

        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Dropout(0.5),  # 全连接层使用常规 dropout
            nn.Linear(128, num_classes)
        )

    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x
```

### Dropout 最佳实践

```python
# Dropout 率选择指南

"""
按层类型推荐的 Dropout 率：

1. 输入层：0.0 - 0.2
   - 轻量或不使用 dropout 以保留输入信息

2. 隐藏层（全连接）：0.3 - 0.5
   - 全连接层的标准 dropout 范围

3. 卷积层：0.1 - 0.3
   - 使用空间 Dropout（Dropout2d）
   - 由于权重共享，使用较低的比率

4. 输出层：0.0
   - 永远不要对输出层应用 dropout

5. 循环层：0.2 - 0.4
   - 使用循环 dropout（对循环连接的 dropout）
"""

class AdaptiveDropout(nn.Module):
    """
    随着训练进行而降低比率的 Dropout。
    实现课程 dropout 策略。
    """
    def __init__(self, initial_p=0.5, final_p=0.1, total_steps=10000):
        super().__init__()
        self.initial_p = initial_p
        self.final_p = final_p
        self.total_steps = total_steps
        self.current_step = 0

    def forward(self, x):
        if self.training:
            # dropout 率的线性衰减
            progress = min(self.current_step / self.total_steps, 1.0)
            current_p = self.initial_p - (self.initial_p - self.final_p) * progress

            if current_p > 0:
                mask = torch.bernoulli(torch.ones_like(x) * (1 - current_p))
                return x * mask / (1 - current_p)
        return x

    def step(self):
        """在每个训练步骤后调用以更新 dropout 率。"""
        self.current_step += 1
```

---

## 批归一化

### 理论和直觉

批归一化（BatchNorm）由 Ioffe 和 Szegedy 于 2015 年提出，通过重新居中和重新缩放来归一化层输入。它解决了内部协变量偏移问题，并已成为深度网络中的标准组件。

**主要优势：**
- 允许更高的学习率
- 降低对初始化的敏感性
- 充当正则化器（减少对 Dropout 的需求）
- 稳定深度网络的训练

**数学公式：**

对于小批量 $B = \{x_1, ..., x_m\}$：

1. **计算批统计量：**
$$\mu_B = \frac{1}{m}\sum_{i=1}^{m}x_i$$
$$\sigma_B^2 = \frac{1}{m}\sum_{i=1}^{m}(x_i - \mu_B)^2$$

2. **归一化：**
$$\hat{x}_i = \frac{x_i - \mu_B}{\sqrt{\sigma_B^2 + \epsilon}}$$

3. **缩放和偏移（可学习参数）：**
$$y_i = \gamma \hat{x}_i + \beta$$

### PyTorch 实现

```python
import torch
import torch.nn as nn

class BatchNormFromScratch(nn.Module):
    """
    自定义批归一化实现。
    包括训练和评估模式。
    """
    def __init__(self, num_features, eps=1e-5, momentum=0.1):
        super().__init__()
        self.num_features = num_features
        self.eps = eps
        self.momentum = momentum

        # 可学习参数
        self.gamma = nn.Parameter(torch.ones(num_features))
        self.beta = nn.Parameter(torch.zeros(num_features))

        # 运行统计量（不可学习）
        self.register_buffer('running_mean', torch.zeros(num_features))
        self.register_buffer('running_var', torch.ones(num_features))

    def forward(self, x):
        if self.training:
            # 计算批统计量
            # x 形状：1D 为 (N, C) 或 2D 为 (N, C, H, W)
            if x.dim() == 2:
                mean = x.mean(dim=0)
                var = x.var(dim=0, unbiased=False)
            elif x.dim() == 4:
                mean = x.mean(dim=(0, 2, 3))
                var = x.var(dim=(0, 2, 3), unbiased=False)

            # 更新运行统计量
            with torch.no_grad():
                self.running_mean = (1 - self.momentum) * self.running_mean + self.momentum * mean
                self.running_var = (1 - self.momentum) * self.running_var + self.momentum * var
        else:
            mean = self.running_mean
            var = self.running_var

        # 归一化
        if x.dim() == 2:
            x_norm = (x - mean) / torch.sqrt(var + self.eps)
            out = self.gamma * x_norm + self.beta
        elif x.dim() == 4:
            mean = mean.view(1, -1, 1, 1)
            var = var.view(1, -1, 1, 1)
            gamma = self.gamma.view(1, -1, 1, 1)
            beta = self.beta.view(1, -1, 1, 1)
            x_norm = (x - mean) / torch.sqrt(var + self.eps)
            out = gamma * x_norm + beta

        return out

class ConvBlockWithBatchNorm(nn.Module):
    """
    现代架构中使用的标准 Conv-BN-ReLU 块。
    BatchNorm 在卷积之后、激活之前应用。
    """
    def __init__(self, in_channels, out_channels, kernel_size=3,
                 stride=1, padding=1, bias=False):
        super().__init__()
        # 注意：bias=False，因为 BatchNorm 有自己的偏置（beta）
        self.conv = nn.Conv2d(in_channels, out_channels, kernel_size,
                              stride, padding, bias=bias)
        self.bn = nn.BatchNorm2d(out_channels)
        self.relu = nn.ReLU(inplace=True)

    def forward(self, x):
        return self.relu(self.bn(self.conv(x)))

class ResNetBlockWithBN(nn.Module):
    """
    带有 BatchNorm 的 ResNet 风格残差块。
    演示残差连接中的正确 BatchNorm 放置。
    """
    def __init__(self, in_channels, out_channels, stride=1):
        super().__init__()

        self.conv1 = nn.Conv2d(in_channels, out_channels, 3, stride, 1, bias=False)
        self.bn1 = nn.BatchNorm2d(out_channels)
        self.conv2 = nn.Conv2d(out_channels, out_channels, 3, 1, 1, bias=False)
        self.bn2 = nn.BatchNorm2d(out_channels)
        self.relu = nn.ReLU(inplace=True)

        # 快捷连接
        self.shortcut = nn.Sequential()
        if stride != 1 or in_channels != out_channels:
            self.shortcut = nn.Sequential(
                nn.Conv2d(in_channels, out_channels, 1, stride, bias=False),
                nn.BatchNorm2d(out_channels)
            )

    def forward(self, x):
        identity = self.shortcut(x)

        out = self.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        out += identity
        out = self.relu(out)

        return out
```

### BatchNorm 注意事项

```python
"""
批归一化的重要注意事项：

1. 批大小依赖：
   - BatchNorm 需要合理大的批大小（>16）
   - 小批量导致噪声统计量
   - 对于小批量使用组归一化或层归一化

2. 训练与评估模式：
   - 训练：使用批统计量
   - 评估：使用运行统计量
   - 推理前始终调用 model.train(False)！

3. 放置：
   - 通常：Conv -> BatchNorm -> Activation
   - 一些论文建议：Conv -> Activation -> BatchNorm

4. 前面层的偏置：
   - 在 BatchNorm 之前的层中设置 bias=False
   - BatchNorm 的 beta 参数充当偏置
"""

class BatchNormDebugger(nn.Module):
    """
    用于在训练期间监控 BatchNorm 统计量的包装器。
    用于调试训练不稳定性。
    """
    def __init__(self, bn_layer, name=""):
        super().__init__()
        self.bn = bn_layer
        self.name = name
        self.stats_history = {
            'batch_mean': [],
            'batch_var': [],
            'running_mean': [],
            'running_var': [],
            'gamma': [],
            'beta': []
        }

    def forward(self, x):
        if self.training:
            # 在前向传递之前记录统计量
            with torch.no_grad():
                if x.dim() == 4:
                    batch_mean = x.mean(dim=(0, 2, 3))
                    batch_var = x.var(dim=(0, 2, 3))
                else:
                    batch_mean = x.mean(dim=0)
                    batch_var = x.var(dim=0)

                self.stats_history['batch_mean'].append(batch_mean.cpu())
                self.stats_history['batch_var'].append(batch_var.cpu())
                self.stats_history['running_mean'].append(
                    self.bn.running_mean.cpu().clone()
                )
                self.stats_history['running_var'].append(
                    self.bn.running_var.cpu().clone()
                )
                self.stats_history['gamma'].append(
                    self.bn.weight.data.cpu().clone()
                )
                self.stats_history['beta'].append(
                    self.bn.bias.data.cpu().clone()
                )

        return self.bn(x)

    def plot_statistics(self):
        """绘制 BatchNorm 统计量在训练过程中的演变。"""
        import matplotlib.pyplot as plt

        fig, axes = plt.subplots(2, 2, figsize=(12, 10))

        # 绘制运行均值
        running_means = torch.stack(self.stats_history['running_mean'])
        axes[0, 0].plot(running_means[:, :5].numpy())  # 前 5 个通道
        axes[0, 0].set_title(f'{self.name} 运行均值（前 5 个通道）')
        axes[0, 0].set_xlabel('步骤')

        # 绘制运行方差
        running_vars = torch.stack(self.stats_history['running_var'])
        axes[0, 1].plot(running_vars[:, :5].numpy())
        axes[0, 1].set_title(f'{self.name} 运行方差（前 5 个通道）')
        axes[0, 1].set_xlabel('步骤')

        # 绘制 gamma
        gammas = torch.stack(self.stats_history['gamma'])
        axes[1, 0].plot(gammas[:, :5].numpy())
        axes[1, 0].set_title(f'{self.name} Gamma（前 5 个通道）')
        axes[1, 0].set_xlabel('步骤')

        # 绘制 beta
        betas = torch.stack(self.stats_history['beta'])
        axes[1, 1].plot(betas[:, :5].numpy())
        axes[1, 1].set_title(f'{self.name} Beta（前 5 个通道）')
        axes[1, 1].set_xlabel('步骤')

        plt.tight_layout()
        plt.savefig(f'{self.name}_bn_statistics.png')
        plt.show()
```

---

## 层归一化

### 理论和直觉

层归一化（LayerNorm）由 Ba 等人于 2016 年提出，跨特征维度而不是批维度进行归一化。这使其特别适合于批统计量不可靠的循环网络和 Transformer。

**与 BatchNorm 的关键区别：**

| 方面 | BatchNorm | LayerNorm |
|--------|-----------|-----------|
| 归一化轴 | 批维度 | 特征维度 |
| 批大小依赖 | 是 | 否 |
| 运行统计量 | 是 | 否 |
| 最适合 | CNN | RNN、Transformer |
| 训练/评估差异 | 是 | 否 |

**数学公式：**

对于形状为 $(N, C, *)$ 的输入 $x$：

$$\mu = \frac{1}{C}\sum_{i=1}^{C}x_i$$
$$\sigma^2 = \frac{1}{C}\sum_{i=1}^{C}(x_i - \mu)^2$$
$$\hat{x} = \frac{x - \mu}{\sqrt{\sigma^2 + \epsilon}}$$
$$y = \gamma \hat{x} + \beta$$

### PyTorch 实现

```python
import torch
import torch.nn as nn

class LayerNormFromScratch(nn.Module):
    """
    自定义层归一化实现。
    跨最后一个维度进行归一化。
    """
    def __init__(self, normalized_shape, eps=1e-5):
        super().__init__()
        if isinstance(normalized_shape, int):
            normalized_shape = (normalized_shape,)
        self.normalized_shape = normalized_shape
        self.eps = eps

        # 可学习参数
        self.gamma = nn.Parameter(torch.ones(normalized_shape))
        self.beta = nn.Parameter(torch.zeros(normalized_shape))

    def forward(self, x):
        # 在归一化维度上计算统计量
        dims = tuple(range(-len(self.normalized_shape), 0))
        mean = x.mean(dim=dims, keepdim=True)
        var = x.var(dim=dims, keepdim=True, unbiased=False)

        # 归一化
        x_norm = (x - mean) / torch.sqrt(var + self.eps)

        # 缩放和偏移
        return self.gamma * x_norm + self.beta

class RMSNorm(nn.Module):
    """
    均方根层归一化。
    LayerNorm 的简化版本，用于 LLaMA 和其他模型。
    不包括均值居中，仅按 RMS 缩放。
    """
    def __init__(self, dim, eps=1e-6):
        super().__init__()
        self.eps = eps
        self.weight = nn.Parameter(torch.ones(dim))

    def forward(self, x):
        # 计算 RMS
        rms = torch.sqrt(x.pow(2).mean(dim=-1, keepdim=True) + self.eps)
        # 归一化和缩放
        return x / rms * self.weight

class TransformerBlockWithLayerNorm(nn.Module):
    """
    展示 Pre-LayerNorm 架构的 Transformer 块。
    Pre-LN 对于训练深层 Transformer 更稳定。
    """
    def __init__(self, d_model, n_heads, d_ff, dropout=0.1):
        super().__init__()

        # Pre-LayerNorm 架构
        self.ln1 = nn.LayerNorm(d_model)
        self.ln2 = nn.LayerNorm(d_model)

        self.self_attn = nn.MultiheadAttention(d_model, n_heads, dropout=dropout)
        self.ffn = nn.Sequential(
            nn.Linear(d_model, d_ff),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(d_ff, d_model),
            nn.Dropout(dropout)
        )
        self.dropout = nn.Dropout(dropout)

    def forward(self, x, mask=None):
        # Pre-LN：在注意力/FFN 之前进行 LayerNorm
        # 残差连接包裹归一化输出

        # 自注意力块
        x_norm = self.ln1(x)
        attn_out, _ = self.self_attn(x_norm, x_norm, x_norm, attn_mask=mask)
        x = x + self.dropout(attn_out)

        # 前馈块
        x_norm = self.ln2(x)
        ffn_out = self.ffn(x_norm)
        x = x + ffn_out

        return x

class PostLayerNormTransformerBlock(nn.Module):
    """
    展示 Post-LayerNorm 架构的 Transformer 块。
    原始 Transformer 架构，但深层训练更困难。
    """
    def __init__(self, d_model, n_heads, d_ff, dropout=0.1):
        super().__init__()

        self.self_attn = nn.MultiheadAttention(d_model, n_heads, dropout=dropout)
        self.ffn = nn.Sequential(
            nn.Linear(d_model, d_ff),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(d_ff, d_model),
            nn.Dropout(dropout)
        )

        # Post-LayerNorm：在残差加法之后进行 LayerNorm
        self.ln1 = nn.LayerNorm(d_model)
        self.ln2 = nn.LayerNorm(d_model)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x, mask=None):
        # 自注意力块
        attn_out, _ = self.self_attn(x, x, x, attn_mask=mask)
        x = self.ln1(x + self.dropout(attn_out))

        # 前馈块
        ffn_out = self.ffn(x)
        x = self.ln2(x + ffn_out)

        return x
```

### 归一化比较

```python
import torch
import torch.nn as nn

class NormalizationComparison(nn.Module):
    """
    演示对同一输入使用不同归一化技术。
    有助于理解行为差异。
    """
    def __init__(self, num_features, num_groups=8):
        super().__init__()
        self.batch_norm = nn.BatchNorm1d(num_features)
        self.layer_norm = nn.LayerNorm(num_features)
        self.instance_norm = nn.InstanceNorm1d(num_features)
        self.group_norm = nn.GroupNorm(num_groups, num_features)

    def forward(self, x):
        """
        x 形状：(batch, features) 或 (batch, features, length)
        返回所有方法的归一化输出。
        """
        results = {
            'input': x,
            'batch_norm': self.batch_norm(x),
            'layer_norm': self.layer_norm(x),
        }

        if x.dim() == 3:
            results['instance_norm'] = self.instance_norm(x)
            results['group_norm'] = self.group_norm(x)

        return results

def compare_normalizations():
    """
    比较不同批大小下的归一化行为。
    """
    model = NormalizationComparison(64)
    model.train()

    print("归一化技术比较：")
    print("=" * 50)

    for batch_size in [1, 4, 32, 128]:
        x = torch.randn(batch_size, 64)
        results = model(x)

        print(f"\n批大小：{batch_size}")
        print("-" * 30)

        for name, output in results.items():
            if name != 'input':
                mean = output.mean().item()
                std = output.std().item()
                print(f"{name:15s} - 均值：{mean:+.4f}，标准差：{std:.4f}")

# 何时使用每种归一化：
"""
1. BatchNorm：
   - CNN 的标准选择
   - 需要 batch_size >= 16 以获得稳定统计量
   - 不适合 RNN 或可变长度序列

2. LayerNorm：
   - Transformer 和 NLP 模型的标准
   - 适用于任何批大小
   - 在训练和推理中行为一致

3. InstanceNorm：
   - 用于风格迁移和图像生成
   - 独立归一化每个样本
   - 移除风格信息

4. GroupNorm：
   - 小批量的 BatchNorm 替代方案
   - 将通道分成组并在组内归一化
   - 适合目标检测（由于大图像导致小批量）

5. RMSNorm：
   - 简化的 LayerNorm（无均值居中）
   - 用于 LLaMA 和其他高效 LLM
   - 比标准 LayerNorm 稍快
"""
```

---

## 数据增强

### 理论和直觉

数据增强通过对现有样本应用变换来人为扩展训练数据集。这迫使模型学习不变性，并在不收集更多数据的情况下改善泛化能力。

**优势：**
- 通过增加有效数据集大小来减少过拟合
- 教导模型所需的不变性
- 可以编码关于问题的领域知识
- 当数据有限时特别有价值

### 使用 PyTorch 进行图像增强

```python
import torch
import torchvision.transforms as T
from torchvision.transforms import v2
import torch.nn as nn

# 基本图像增强流程
basic_augmentation = T.Compose([
    T.RandomHorizontalFlip(p=0.5),
    T.RandomRotation(degrees=15),
    T.RandomResizedCrop(224, scale=(0.8, 1.0)),
    T.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1),
    T.ToTensor(),
    T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# 高级增强流程
advanced_augmentation = T.Compose([
    T.RandomResizedCrop(224, scale=(0.6, 1.0), ratio=(0.75, 1.33)),
    T.RandomHorizontalFlip(p=0.5),
    T.RandomApply([
        T.ColorJitter(brightness=0.4, contrast=0.4, saturation=0.4, hue=0.1)
    ], p=0.8),
    T.RandomGrayscale(p=0.2),
    T.RandomApply([
        T.GaussianBlur(kernel_size=23, sigma=(0.1, 2.0))
    ], p=0.5),
    T.ToTensor(),
    T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    T.RandomErasing(p=0.5, scale=(0.02, 0.33), ratio=(0.3, 3.3))
])

# 验证/测试流程（无增强）
val_transform = T.Compose([
    T.Resize(256),
    T.CenterCrop(224),
    T.ToTensor(),
    T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

class AutoAugment(nn.Module):
    """
    AutoAugment 策略的包装器。
    使用在代理任务上搜索得到的学习增强策略。
    """
    def __init__(self, policy="imagenet"):
        super().__init__()
        if policy == "imagenet":
            self.augment = T.AutoAugment(T.AutoAugmentPolicy.IMAGENET)
        elif policy == "cifar10":
            self.augment = T.AutoAugment(T.AutoAugmentPolicy.CIFAR10)
        elif policy == "svhn":
            self.augment = T.AutoAugment(T.AutoAugmentPolicy.SVHN)

    def forward(self, img):
        return self.augment(img)

class RandAugment(nn.Module):
    """
    RandAugment：AutoAugment 的更简单替代方案。
    从集合中随机选择 N 个变换并以幅度 M 应用。
    """
    def __init__(self, n_ops=2, magnitude=9):
        super().__init__()
        self.augment = T.RandAugment(num_ops=n_ops, magnitude=magnitude)

    def forward(self, img):
        return self.augment(img)

# 带有增强的完整训练流程
def create_data_loaders(train_dataset, val_dataset, batch_size=32):
    """
    创建带有适当增强的数据加载器。
    """
    # 应用变换
    train_dataset.transform = T.Compose([
        T.RandomResizedCrop(224),
        T.RandAugment(num_ops=2, magnitude=9),
        T.ToTensor(),
        T.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        T.RandomErasing(p=0.25)
    ])

    val_dataset.transform = T.Compose([
        T.Resize(256),
        T.CenterCrop(224),
        T.ToTensor(),
        T.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    train_loader = torch.utils.data.DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=4,
        pin_memory=True
    )

    val_loader = torch.utils.data.DataLoader(
        val_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=4,
        pin_memory=True
    )

    return train_loader, val_loader
```

### 自定义增强变换

```python
import torch
import torch.nn as nn
import numpy as np
from PIL import Image

class GridMask(nn.Module):
    """
    GridMask 增强：从图像中移除网格结构区域。
    强制模型从部分观察中学习。
    """
    def __init__(self, d1=96, d2=224, rotate=1, ratio=0.5, mode=0, prob=0.5):
        super().__init__()
        self.d1 = d1
        self.d2 = d2
        self.rotate = rotate
        self.ratio = ratio
        self.mode = mode
        self.prob = prob

    def forward(self, x):
        if np.random.random() > self.prob:
            return x

        _, h, w = x.shape

        # 随机网格参数
        d = np.random.randint(self.d1, self.d2)
        l = int(d * self.ratio + 0.5)

        mask = np.ones((h, w), np.float32)
        st_h = np.random.randint(d)
        st_w = np.random.randint(d)

        for i in range(0, h, d):
            s = i + st_h
            t = min(s + l, h)
            for j in range(0, w, d):
                u = j + st_w
                v = min(u + l, w)
                mask[s:t, u:v] = 0

        mask = torch.from_numpy(mask).float()
        return x * mask

class CutoutTransform(nn.Module):
    """
    Cutout 增强：随机遮挡方形区域。
    简单但有效的正则化技术。
    """
    def __init__(self, n_holes=1, length=16):
        super().__init__()
        self.n_holes = n_holes
        self.length = length

    def forward(self, img):
        _, h, w = img.shape
        mask = torch.ones((h, w), dtype=torch.float32)

        for _ in range(self.n_holes):
            y = np.random.randint(h)
            x = np.random.randint(w)

            y1 = np.clip(y - self.length // 2, 0, h)
            y2 = np.clip(y + self.length // 2, 0, h)
            x1 = np.clip(x - self.length // 2, 0, w)
            x2 = np.clip(x + self.length // 2, 0, w)

            mask[y1:y2, x1:x2] = 0.0

        return img * mask

class AugmentationScheduler:
    """
    在训练过程中逐渐增加增强强度。
    实现渐进增强策略。
    """
    def __init__(self, base_transforms, max_magnitude=15, warmup_epochs=5):
        self.base_transforms = base_transforms
        self.max_magnitude = max_magnitude
        self.warmup_epochs = warmup_epochs
        self.current_epoch = 0

    def get_transform(self):
        # 计算当前幅度
        progress = min(self.current_epoch / self.warmup_epochs, 1.0)
        current_magnitude = int(self.max_magnitude * progress)

        return T.Compose([
            *self.base_transforms,
            T.RandAugment(num_ops=2, magnitude=current_magnitude),
            T.ToTensor(),
            T.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])

    def step(self):
        self.current_epoch += 1
```

### 文本数据增强

```python
import random
import re

class TextAugmenter:
    """
    用于 NLP 任务的文本增强技术集合。
    """
    def __init__(self, p=0.1):
        self.p = p

    def random_deletion(self, words):
        """以概率 p 随机删除单词。"""
        if len(words) == 1:
            return words

        new_words = []
        for word in words:
            if random.random() > self.p:
                new_words.append(word)

        if len(new_words) == 0:
            return [random.choice(words)]

        return new_words

    def random_swap(self, words, n=1):
        """随机交换 n 对单词。"""
        words = words.copy()
        for _ in range(n):
            if len(words) >= 2:
                idx1, idx2 = random.sample(range(len(words)), 2)
                words[idx1], words[idx2] = words[idx2], words[idx1]
        return words

    def random_insertion(self, words, synonyms_dict, n=1):
        """在随机位置插入 n 个随机同义词。"""
        words = words.copy()
        for _ in range(n):
            # 获取随机单词及其同义词
            word = random.choice(words)
            if word in synonyms_dict:
                synonym = random.choice(synonyms_dict[word])
                position = random.randint(0, len(words))
                words.insert(position, synonym)
        return words

    def back_translation(self, text, src_lang='en', pivot_lang='de'):
        """
        回译增强（需要翻译模型）。
        翻译到枢纽语言然后翻译回来。
        """
        # 占位符 - 将使用翻译 API 或模型
        # translated = translate(text, src_lang, pivot_lang)
        # back_translated = translate(translated, pivot_lang, src_lang)
        # return back_translated
        pass

    def augment(self, text, methods=['deletion', 'swap']):
        """应用多种增强方法。"""
        words = text.split()

        if 'deletion' in methods:
            words = self.random_deletion(words)
        if 'swap' in methods:
            words = self.random_swap(words)

        return ' '.join(words)

class EmbeddingAugmentation(nn.Module):
    """
    NLP 的嵌入级别增强。
    在训练期间向词嵌入添加噪声。
    """
    def __init__(self, noise_std=0.1, dropout_prob=0.1):
        super().__init__()
        self.noise_std = noise_std
        self.dropout_prob = dropout_prob

    def forward(self, embeddings):
        if self.training:
            # 添加高斯噪声
            noise = torch.randn_like(embeddings) * self.noise_std
            embeddings = embeddings + noise

            # 随机 token dropout（设为零）
            mask = torch.bernoulli(
                torch.ones(embeddings.shape[:-1]) * (1 - self.dropout_prob)
            ).unsqueeze(-1).to(embeddings.device)
            embeddings = embeddings * mask

        return embeddings
```

---

## Mixup 和高级增强

### Mixup

Mixup 是一种数据增强技术，在成对样本及其标签的凸组合上进行训练。它鼓励训练样本之间的线性行为并改善泛化能力。

**数学公式：**

$$\tilde{x} = \lambda x_i + (1 - \lambda) x_j$$
$$\tilde{y} = \lambda y_i + (1 - \lambda) y_j$$

其中 $\lambda \sim \text{Beta}(\alpha, \alpha)$

```python
import torch
import torch.nn as nn
import numpy as np

def mixup_data(x, y, alpha=1.0):
    """
    对一批数据应用 Mixup。
    返回混合的输入、目标对和混合系数。
    """
    if alpha > 0:
        lam = np.random.beta(alpha, alpha)
    else:
        lam = 1

    batch_size = x.size(0)
    index = torch.randperm(batch_size).to(x.device)

    mixed_x = lam * x + (1 - lam) * x[index]
    y_a, y_b = y, y[index]

    return mixed_x, y_a, y_b, lam

def mixup_criterion(criterion, pred, y_a, y_b, lam):
    """
    计算 Mixup 训练的损失。
    """
    return lam * criterion(pred, y_a) + (1 - lam) * criterion(pred, y_b)

class MixupTrainer:
    """
    带有 Mixup 增强的完整训练循环。
    """
    def __init__(self, model, optimizer, criterion, alpha=1.0, device='cuda'):
        self.model = model.to(device)
        self.optimizer = optimizer
        self.criterion = criterion
        self.alpha = alpha
        self.device = device

    def train_epoch(self, train_loader):
        self.model.train()
        total_loss = 0
        correct = 0
        total = 0

        for inputs, targets in train_loader:
            inputs, targets = inputs.to(self.device), targets.to(self.device)

            # 应用 Mixup
            mixed_inputs, targets_a, targets_b, lam = mixup_data(
                inputs, targets, self.alpha
            )

            # 前向传递
            outputs = self.model(mixed_inputs)
            loss = mixup_criterion(
                self.criterion, outputs, targets_a, targets_b, lam
            )

            # 反向传递
            self.optimizer.zero_grad()
            loss.backward()
            self.optimizer.step()

            # 统计
            total_loss += loss.item()
            _, predicted = outputs.max(1)
            total += targets.size(0)
            # 对于准确率，使用主导标签
            correct += (
                lam * predicted.eq(targets_a).sum().float() +
                (1 - lam) * predicted.eq(targets_b).sum().float()
            ).item()

        return total_loss / len(train_loader), correct / total
```

### CutMix

CutMix 通过在训练图像之间剪切和粘贴补丁来结合 Cutout 和 Mixup。

```python
import torch
import numpy as np

def cutmix_data(x, y, alpha=1.0):
    """
    对一批数据应用 CutMix。
    从一个图像剪切补丁并粘贴到另一个图像上。
    """
    if alpha > 0:
        lam = np.random.beta(alpha, alpha)
    else:
        lam = 1

    batch_size = x.size(0)
    index = torch.randperm(batch_size).to(x.device)

    # 获取边界框
    _, _, H, W = x.shape
    cut_rat = np.sqrt(1.0 - lam)
    cut_w = int(W * cut_rat)
    cut_h = int(H * cut_rat)

    # 随机中心点
    cx = np.random.randint(W)
    cy = np.random.randint(H)

    # 边界框坐标
    bbx1 = np.clip(cx - cut_w // 2, 0, W)
    bby1 = np.clip(cy - cut_h // 2, 0, H)
    bbx2 = np.clip(cx + cut_w // 2, 0, W)
    bby2 = np.clip(cy + cut_h // 2, 0, H)

    # 应用 CutMix
    mixed_x = x.clone()
    mixed_x[:, :, bby1:bby2, bbx1:bbx2] = x[index, :, bby1:bby2, bbx1:bbx2]

    # 根据实际框面积调整 lambda
    lam = 1 - ((bbx2 - bbx1) * (bby2 - bby1) / (W * H))

    return mixed_x, y, y[index], lam

class CutMixCollator:
    """
    应用 CutMix 的 DataLoader 自定义收集器。
    """
    def __init__(self, alpha=1.0, prob=0.5):
        self.alpha = alpha
        self.prob = prob

    def __call__(self, batch):
        images, labels = zip(*batch)
        images = torch.stack(images)
        labels = torch.tensor(labels)

        if np.random.random() < self.prob:
            images, labels_a, labels_b, lam = cutmix_data(
                images, labels, self.alpha
            )
            return images, (labels_a, labels_b, lam)

        return images, (labels, labels, 1.0)
```

### Manifold Mixup

Manifold Mixup 在隐藏层而不是输入空间应用混合。

```python
import torch
import torch.nn as nn
import numpy as np

class ManifoldMixupModel(nn.Module):
    """
    具有 Manifold Mixup 能力的模型。
    混合可以在训练期间在任何指定层发生。
    """
    def __init__(self, base_model, mixup_layers=[0, 1, 2]):
        super().__init__()
        self.base_model = base_model
        self.mixup_layers = mixup_layers
        self.mixup_enabled = False
        self.mixup_lam = 1.0
        self.mixup_index = None
        self.mixup_layer_idx = None

    def set_mixup(self, lam, index, layer_idx):
        """为下一次前向传递设置 Mixup 参数。"""
        self.mixup_enabled = True
        self.mixup_lam = lam
        self.mixup_index = index
        self.mixup_layer_idx = layer_idx

    def disable_mixup(self):
        """禁用 Mixup。"""
        self.mixup_enabled = False

    def forward(self, x):
        # 从基础模型获取层（假设类似 Sequential 的结构）
        layers = list(self.base_model.children())

        for i, layer in enumerate(layers):
            x = layer(x)

            # 在选定层应用 Mixup
            if self.mixup_enabled and i == self.mixup_layer_idx:
                x = self.mixup_lam * x + (1 - self.mixup_lam) * x[self.mixup_index]

        return x

def train_with_manifold_mixup(model, train_loader, optimizer, criterion,
                               alpha=1.0, device='cuda'):
    """
    使用 Manifold Mixup 的训练循环。
    """
    model.train()
    total_loss = 0

    for inputs, targets in train_loader:
        inputs, targets = inputs.to(device), targets.to(device)
        batch_size = inputs.size(0)

        # 采样 Mixup 参数
        lam = np.random.beta(alpha, alpha)
        index = torch.randperm(batch_size).to(device)
        layer_idx = np.random.choice(model.mixup_layers)

        # 为此批次设置 Mixup
        model.set_mixup(lam, index, layer_idx)

        # 前向传递
        outputs = model(inputs)

        # 计算混合损失
        loss = lam * criterion(outputs, targets) + \
               (1 - lam) * criterion(outputs, targets[index])

        # 反向传递
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        # 禁用 Mixup
        model.disable_mixup()

        total_loss += loss.item()

    return total_loss / len(train_loader)
```

### AugMax：对抗性增强

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class AugMax:
    """
    AugMax：用于鲁棒训练的对抗性数据增强。
    在集合中找到最具挑战性的增强。
    """
    def __init__(self, augmentations, alpha=0.5):
        self.augmentations = augmentations
        self.alpha = alpha

    def __call__(self, model, images, labels, criterion):
        """
        找到最大化损失的增强。
        """
        model.train(False)
        max_loss = float('-inf')
        worst_aug_images = images

        with torch.no_grad():
            for aug in self.augmentations:
                aug_images = aug(images)
                outputs = model(aug_images)
                loss = criterion(outputs, labels)

                if loss.item() > max_loss:
                    max_loss = loss.item()
                    worst_aug_images = aug_images

        model.train()

        # 混合原始和最坏情况增强图像
        mixed_images = self.alpha * images + (1 - self.alpha) * worst_aug_images

        return mixed_images

class AdversarialTraining:
    """
    基于 FGSM 的对抗训练以提高鲁棒性。
    """
    def __init__(self, epsilon=0.03, alpha=0.01):
        self.epsilon = epsilon
        self.alpha = alpha

    def generate_adversarial(self, model, images, labels, criterion):
        """使用 FGSM 生成对抗样本。"""
        images = images.clone().detach().requires_grad_(True)

        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()

        # FGSM 攻击
        perturbation = self.epsilon * images.grad.sign()
        adv_images = images + perturbation
        adv_images = torch.clamp(adv_images, 0, 1)

        return adv_images.detach()

    def train_step(self, model, images, labels, optimizer, criterion):
        """使用对抗样本的训练步骤。"""
        # 生成对抗样本
        adv_images = self.generate_adversarial(model, images, labels, criterion)

        # 组合干净和对抗样本
        combined_images = torch.cat([images, adv_images])
        combined_labels = torch.cat([labels, labels])

        # 前向和反向
        optimizer.zero_grad()
        outputs = model(combined_images)
        loss = criterion(outputs, combined_labels)
        loss.backward()
        optimizer.step()

        return loss.item()
```

---

## 组合正则化技术

### 有效组合

```python
import torch
import torch.nn as nn

class WellRegularizedCNN(nn.Module):
    """
    具有多种互补正则化技术的 CNN。
    演示组合正则化的最佳实践。
    """
    def __init__(self, num_classes=10, dropout_rate=0.3):
        super().__init__()

        # 使用 BatchNorm 进行特征提取（正则化）
        self.features = nn.Sequential(
            # 块 1
            nn.Conv2d(3, 64, 3, padding=1, bias=False),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.Conv2d(64, 64, 3, padding=1, bias=False),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            nn.Dropout2d(dropout_rate * 0.5),  # 轻量空间 dropout

            # 块 2
            nn.Conv2d(64, 128, 3, padding=1, bias=False),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.Conv2d(128, 128, 3, padding=1, bias=False),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2, 2),
            nn.Dropout2d(dropout_rate * 0.5),

            # 块 3
            nn.Conv2d(128, 256, 3, padding=1, bias=False),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
            nn.Conv2d(256, 256, 3, padding=1, bias=False),
            nn.BatchNorm2d(256),
            nn.ReLU(inplace=True),
            nn.AdaptiveAvgPool2d((1, 1))
        )

        # 带 Dropout 的分类器
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(256, 128),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout_rate),
            nn.Linear(128, num_classes)
        )

    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x

class WellRegularizedTransformer(nn.Module):
    """
    具有全面正则化的 Transformer 编码器。
    """
    def __init__(self, vocab_size, d_model=512, n_heads=8, n_layers=6,
                 d_ff=2048, max_len=512, num_classes=10, dropout=0.1):
        super().__init__()

        # 嵌入
        self.token_embedding = nn.Embedding(vocab_size, d_model)
        self.position_embedding = nn.Embedding(max_len, d_model)
        self.embed_dropout = nn.Dropout(dropout)

        # 带 LayerNorm 的 Transformer 层
        self.layers = nn.ModuleList([
            TransformerBlockWithLayerNorm(d_model, n_heads, d_ff, dropout)
            for _ in range(n_layers)
        ])

        # 最终 LayerNorm
        self.final_ln = nn.LayerNorm(d_model)

        # 分类器
        self.classifier = nn.Sequential(
            nn.Linear(d_model, d_model // 2),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(d_model // 2, num_classes)
        )

        # 初始化权重
        self._init_weights()

    def _init_weights(self):
        """使用小值初始化权重以保持稳定性。"""
        for p in self.parameters():
            if p.dim() > 1:
                nn.init.xavier_uniform_(p)

    def forward(self, x, mask=None):
        seq_len = x.size(1)
        positions = torch.arange(seq_len, device=x.device).unsqueeze(0)

        # 带 dropout 的嵌入
        x = self.token_embedding(x) + self.position_embedding(positions)
        x = self.embed_dropout(x)

        # Transformer 层
        for layer in self.layers:
            x = layer(x, mask)

        # 最终归一化
        x = self.final_ln(x)

        # 从 [CLS] token 或均值池化进行分类
        x = x.mean(dim=1)  # 均值池化
        x = self.classifier(x)

        return x

# 之前的 TransformerBlockWithLayerNorm 类
class TransformerBlockWithLayerNorm(nn.Module):
    def __init__(self, d_model, n_heads, d_ff, dropout=0.1):
        super().__init__()
        self.ln1 = nn.LayerNorm(d_model)
        self.ln2 = nn.LayerNorm(d_model)
        self.self_attn = nn.MultiheadAttention(d_model, n_heads, dropout=dropout, batch_first=True)
        self.ffn = nn.Sequential(
            nn.Linear(d_model, d_ff),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(d_ff, d_model),
            nn.Dropout(dropout)
        )
        self.dropout = nn.Dropout(dropout)

    def forward(self, x, mask=None):
        x_norm = self.ln1(x)
        attn_out, _ = self.self_attn(x_norm, x_norm, x_norm, attn_mask=mask)
        x = x + self.dropout(attn_out)
        x_norm = self.ln2(x)
        ffn_out = self.ffn(x_norm)
        x = x + ffn_out
        return x
```

### 带正则化的完整训练流程

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
import torchvision.transforms as T
from tqdm import tqdm

class RegularizedTrainer:
    """
    具有多种正则化技术的完整训练流程。
    包括：Mixup、数据增强、权重衰减、dropout、归一化。
    """
    def __init__(self, model, train_loader, val_loader,
                 learning_rate=0.001, weight_decay=0.01,
                 mixup_alpha=0.2, label_smoothing=0.1,
                 device='cuda'):

        self.model = model.to(device)
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.device = device
        self.mixup_alpha = mixup_alpha

        # 带标签平滑的损失
        self.criterion = nn.CrossEntropyLoss(label_smoothing=label_smoothing)

        # 带权重衰减的优化器
        self.optimizer = optim.AdamW(
            model.parameters(),
            lr=learning_rate,
            weight_decay=weight_decay
        )

        # 学习率调度器
        self.scheduler = optim.lr_scheduler.CosineAnnealingWarmRestarts(
            self.optimizer, T_0=10, T_mult=2
        )

        # 跟踪
        self.train_losses = []
        self.val_losses = []
        self.val_accuracies = []

    def train_epoch(self):
        self.model.train()
        total_loss = 0
        correct = 0
        total = 0

        pbar = tqdm(self.train_loader, desc='训练中')
        for inputs, targets in pbar:
            inputs, targets = inputs.to(self.device), targets.to(self.device)

            # 以 0.5 的概率应用 Mixup
            if self.mixup_alpha > 0 and torch.rand(1).item() < 0.5:
                mixed_inputs, targets_a, targets_b, lam = mixup_data(
                    inputs, targets, self.mixup_alpha
                )
                outputs = self.model(mixed_inputs)
                loss = mixup_criterion(
                    self.criterion, outputs, targets_a, targets_b, lam
                )
            else:
                outputs = self.model(inputs)
                loss = self.criterion(outputs, targets)

            # 反向传递
            self.optimizer.zero_grad()
            loss.backward()

            # 梯度裁剪
            torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)

            self.optimizer.step()

            # 统计
            total_loss += loss.item()
            _, predicted = outputs.max(1)
            total += targets.size(0)
            correct += predicted.eq(targets).sum().item()

            pbar.set_postfix({
                'loss': f'{loss.item():.4f}',
                'acc': f'{100. * correct / total:.2f}%'
            })

        return total_loss / len(self.train_loader), correct / total

    @torch.no_grad()
    def validate(self):
        self.model.train(False)
        total_loss = 0
        correct = 0
        total = 0

        for inputs, targets in self.val_loader:
            inputs, targets = inputs.to(self.device), targets.to(self.device)

            outputs = self.model(inputs)
            loss = self.criterion(outputs, targets)

            total_loss += loss.item()
            _, predicted = outputs.max(1)
            total += targets.size(0)
            correct += predicted.eq(targets).sum().item()

        return total_loss / len(self.val_loader), correct / total

    def train(self, epochs, early_stopping_patience=10):
        best_val_acc = 0
        patience_counter = 0

        for epoch in range(epochs):
            print(f'\n轮次 {epoch + 1}/{epochs}')

            # 训练
            train_loss, train_acc = self.train_epoch()
            self.train_losses.append(train_loss)

            # 验证
            val_loss, val_acc = self.validate()
            self.val_losses.append(val_loss)
            self.val_accuracies.append(val_acc)

            # 更新调度器
            self.scheduler.step()

            print(f'训练损失：{train_loss:.4f}，训练准确率：{train_acc*100:.2f}%')
            print(f'验证损失：{val_loss:.4f}，验证准确率：{val_acc*100:.2f}%')
            print(f'学习率：{self.optimizer.param_groups[0]["lr"]:.6f}')

            # 早停和模型保存
            if val_acc > best_val_acc:
                best_val_acc = val_acc
                patience_counter = 0
                torch.save({
                    'epoch': epoch,
                    'model_state_dict': self.model.state_dict(),
                    'optimizer_state_dict': self.optimizer.state_dict(),
                    'val_acc': val_acc
                }, 'best_model.pt')
                print(f'保存最佳模型，验证准确率：{val_acc*100:.2f}%')
            else:
                patience_counter += 1
                if patience_counter >= early_stopping_patience:
                    print(f'在轮次 {epoch + 1} 早停')
                    break

        return self.train_losses, self.val_losses, self.val_accuracies

# 使用示例
def main():
    # 设置设备
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    # 创建带正则化的模型
    model = WellRegularizedCNN(num_classes=10, dropout_rate=0.3)

    # 创建带增强的数据加载器
    train_transform = T.Compose([
        T.RandomResizedCrop(32, scale=(0.8, 1.0)),
        T.RandomHorizontalFlip(),
        T.RandAugment(num_ops=2, magnitude=9),
        T.ToTensor(),
        T.Normalize([0.4914, 0.4822, 0.4465], [0.2023, 0.1994, 0.2010]),
        T.RandomErasing(p=0.25)
    ])

    val_transform = T.Compose([
        T.ToTensor(),
        T.Normalize([0.4914, 0.4822, 0.4465], [0.2023, 0.1994, 0.2010])
    ])

    # 加载数据集（以 CIFAR-10 为例）
    # train_dataset = torchvision.datasets.CIFAR10(...)
    # val_dataset = torchvision.datasets.CIFAR10(...)

    # 创建训练器
    # trainer = RegularizedTrainer(
    #     model, train_loader, val_loader,
    #     learning_rate=0.001,
    #     weight_decay=0.01,
    #     mixup_alpha=0.2,
    #     label_smoothing=0.1,
    #     device=device
    # )

    # 训练
    # trainer.train(epochs=100, early_stopping_patience=15)

if __name__ == '__main__':
    main()
```

---

## 最佳实践和指南

### 正则化选择指南

```python
"""
按模型类型和任务的正则化选择指南：

1. 卷积神经网络（图像分类）：
   - BatchNorm：几乎总是使用
   - Dropout：FC 层 0.2-0.5，conv 层空间 dropout 0.1-0.2
   - 数据增强：RandAugment 或 AutoAugment
   - Mixup/CutMix：alpha=0.2-0.4
   - 权重衰减：1e-4 到 1e-2
   - 标签平滑：0.1

2. Transformer（NLP）：
   - LayerNorm：深层模型使用 Pre-LN
   - Dropout：注意力和 FFN 上 0.1-0.3
   - 权重衰减：0.01-0.1
   - 标签平滑：0.1
   - 不使用 BatchNorm（可变序列长度）

3. Transformer（视觉）：
   - LayerNorm：ViT 中的标准
   - 随机深度：0.1-0.3
   - Mixup/CutMix：alpha=0.8-1.0
   - RandAugment：幅度 9-15
   - 由于缺乏归纳偏置需要重增强

4. 循环网络（RNN/LSTM）：
   - LayerNorm 或不使用归一化
   - 循环 Dropout：0.2-0.5
   - 权重衰减：1e-5 到 1e-3
   - 梯度裁剪：必不可少

5. 小数据集（<10k 样本）：
   - 重数据增强
   - 更高的 dropout 率（0.5+）
   - 强权重衰减
   - 首先考虑迁移学习

6. 大数据集（>100k 样本）：
   - 轻量正则化
   - 较低 dropout（0.1-0.3）
   - 专注于数据增强
   - Mixup/CutMix 非常有效
"""

class RegularizationConfig:
    """
    根据任务选择正则化的配置类。
    """
    @staticmethod
    def get_cnn_config(dataset_size='medium'):
        configs = {
            'small': {
                'dropout': 0.5,
                'spatial_dropout': 0.3,
                'weight_decay': 1e-3,
                'mixup_alpha': 0.4,
                'label_smoothing': 0.1,
                'augmentation': 'heavy'
            },
            'medium': {
                'dropout': 0.3,
                'spatial_dropout': 0.2,
                'weight_decay': 1e-4,
                'mixup_alpha': 0.2,
                'label_smoothing': 0.1,
                'augmentation': 'medium'
            },
            'large': {
                'dropout': 0.2,
                'spatial_dropout': 0.1,
                'weight_decay': 1e-5,
                'mixup_alpha': 0.1,
                'label_smoothing': 0.0,
                'augmentation': 'light'
            }
        }
        return configs.get(dataset_size, configs['medium'])

    @staticmethod
    def get_transformer_config(task='nlp'):
        configs = {
            'nlp': {
                'dropout': 0.1,
                'weight_decay': 0.01,
                'label_smoothing': 0.1,
                'warmup_steps': 4000,
                'gradient_clip': 1.0
            },
            'vision': {
                'dropout': 0.0,
                'stochastic_depth': 0.1,
                'weight_decay': 0.05,
                'mixup_alpha': 0.8,
                'cutmix_alpha': 1.0,
                'label_smoothing': 0.1
            }
        }
        return configs.get(task, configs['nlp'])
```

### 常见错误避免

```python
"""
常见正则化错误：

1. 推理时忘记 model.train(False)：
   - BatchNorm 只有在非训练时才使用运行统计量
   - Dropout 只有在非训练时才禁用

   错误：
   predictions = model(test_data)

   正确：
   model.train(False)
   with torch.no_grad():
       predictions = model(test_data)

2. 使用 BatchNorm 时批大小非常小：
   - 统计量变得嘈杂和不稳定
   - 对于 batch_size < 16 使用 GroupNorm 或 LayerNorm

3. 对验证/测试数据应用增强：
   - 增强仅用于训练
   - 验证使用确定性变换

4. 过度正则化：
   - 太多正则化导致欠拟合
   - 从轻量开始，如果过拟合持续则增加

5. 在 BatchNorm 之前的层使用偏置：
   - BatchNorm 的 beta 参数已经充当偏置
   - 在 BatchNorm 之前的 Conv2d/Linear 中设置 bias=False

6. 不调整 Mixup/CutMix 的指标：
   - 这些技术产生软标签
   - 准确率计算需要调整

7. 对输出层应用 Dropout：
   - 永远不要在最终输出层使用 dropout
   - 可能使预测不稳定
"""

# 示例：正确的模型评估
def assess_model_correctly(model, test_loader, device):
    """演示正确的评估过程。"""
    model.train(False)  # 关键：设置为非训练模式

    correct = 0
    total = 0

    with torch.no_grad():  # 禁用梯度计算
        for inputs, targets in test_loader:
            inputs, targets = inputs.to(device), targets.to(device)
            outputs = model(inputs)
            _, predicted = outputs.max(1)
            total += targets.size(0)
            correct += predicted.eq(targets).sum().item()

    # 如果继续训练，记得设回训练模式
    # model.train()

    return correct / total
```

---

## 面试问题

### 概念问题

**问题1：解释批归一化和层归一化的区别。什么时候使用每种？**

**答案：**
- **BatchNorm** 跨批维度归一化，为批中所有样本的每个特征计算均值和方差。它需要合理大的批大小以获得稳定统计量，并为推理维护运行统计量。
- **LayerNorm** 跨特征维度为每个样本独立归一化。它不依赖批大小，在训练和推理期间行为相同。

**使用场景：**
- BatchNorm：CNN，大批量训练，当批统计量有意义时
- LayerNorm：Transformer，RNN，小批量，可变长度序列

```python
# 可视化比较
# BatchNorm：对每个 C 在 (N,) 上归一化
# 输入：(N, C, H, W) -> 对每个 (C, H, W) 跨 N 归一化

# LayerNorm：对每个 N 在 (C,) 或 (C, H, W) 上归一化
# 输入：(N, C) -> 对每个 N 跨 C 归一化
```

**问题2：为什么 Dropout 作为正则化器有效？**

**答案：**
Dropout 通过几种机制工作：
1. **集成效果**：使用 dropout 训练大约等于训练具有共享权重的网络集成
2. **防止共同适应**：强制神经元学习独立有用的特征
3. **噪声注入**：在隐藏层中充当数据增强
4. **权重平均**：在测试时，缩放的权重近似于集成的几何均值

**问题3：为什么 Mixup 有效，它有什么局限性？**

**答案：**
**有效性：**
- 通过线性插值创建虚拟训练样本
- 鼓励训练样本之间的线性行为
- 平滑决策边界，减少过度自信的预测
- 充当数据相关的正则化形式

**局限性：**
- 当类别非常不同时可能模糊决策边界
- 不适合所有任务（例如，未经修改的目标检测）
- 需要调整 alpha 参数
- 可能对非常小的数据集产生负面影响

### 实践问题

**问题4：您观察到模型训练准确率高但验证准确率低。您会按什么顺序尝试哪些正则化技术？**

```python
"""
解决过拟合的系统方法：

1. 首先，验证问题：
   - 绘制学习曲线
   - 检查数据泄漏
   - 确保训练/验证拆分正确

2. 数据级别修复（首先尝试）：
   - 添加数据增强
   - 实现 Mixup/CutMix
   - 如果可能收集更多数据

3. 模型级别修复：
   - 添加 Dropout（从 0.3 开始，调整）
   - 确保使用 BatchNorm/LayerNorm
   - 如果需要减少模型容量

4. 训练级别修复：
   - 添加权重衰减（1e-4 到 1e-2）
   - 实现早停
   - 添加标签平滑

5. 高级技术（如果以上不足）：
   - 深层网络的随机深度
   - R-Drop（正则化 dropout）
   - 从较小模型进行知识蒸馏
"""
```

**问题5：实现一个结合 L2 权重衰减和梯度惩罚的自定义正则化技术。**

```python
class GradientPenaltyRegularizer:
    """
    结合 L2 权重衰减和梯度惩罚以获得更平滑的梯度。
    """
    def __init__(self, model, lambda_l2=1e-4, lambda_gp=0.1):
        self.model = model
        self.lambda_l2 = lambda_l2
        self.lambda_gp = lambda_gp

    def __call__(self, inputs, outputs, targets, criterion):
        # 基础损失
        loss = criterion(outputs, targets)

        # L2 正则化
        l2_reg = sum(p.pow(2).sum() for p in self.model.parameters())
        loss = loss + self.lambda_l2 * l2_reg

        # 梯度惩罚
        gradients = torch.autograd.grad(
            outputs=outputs.sum(),
            inputs=inputs,
            create_graph=True,
            retain_graph=True
        )[0]

        gradient_penalty = gradients.pow(2).sum(dim=list(range(1, gradients.dim()))).mean()
        loss = loss + self.lambda_gp * gradient_penalty

        return loss
```

**问题6：如何调试 BatchNorm 导致训练不稳定的模型？**

```python
"""
BatchNorm 调试清单：

1. 检查批大小：
   - 太小（<8）导致嘈杂统计量
   - 解决方案：使用更大批量或 GroupNorm

2. 监控运行统计量：
   - 在训练过程中绘制 running_mean 和 running_var
   - 查找极端值或 NaN

3. 检查学习率：
   - 高学习率可能导致 BN 不稳定
   - 尝试降低 LR 或使用预热

4. 验证模式切换：
   - 确保训练时 model.train()
   - 确保验证时 model.train(False)

5. 检查尺度问题：
   - 非常大或非常小的输入值
   - 在输入网络之前归一化输入

6. 替代方法：
   - 尝试 LayerNorm 或 GroupNorm
   - 临时使用不带仿射参数的 BatchNorm
   - 检查从第一层移除 BN 是否有帮助
"""

def diagnose_batchnorm(model, train_loader, device):
    """诊断 BatchNorm 问题。"""
    model.train()

    # 收集 BN 层
    bn_layers = {}
    for name, module in model.named_modules():
        if isinstance(module, nn.BatchNorm2d):
            bn_layers[name] = {
                'running_mean': [],
                'running_var': [],
                'weight': [],
                'bias': []
            }

    # 运行几个批次
    for i, (inputs, _) in enumerate(train_loader):
        if i >= 10:
            break
        inputs = inputs.to(device)
        _ = model(inputs)

        for name, module in model.named_modules():
            if name in bn_layers:
                bn_layers[name]['running_mean'].append(
                    module.running_mean.mean().item()
                )
                bn_layers[name]['running_var'].append(
                    module.running_var.mean().item()
                )

    # 分析
    for name, stats in bn_layers.items():
        mean_trend = stats['running_mean']
        var_trend = stats['running_var']

        print(f"\n{name}:")
        print(f"  均值范围：[{min(mean_trend):.4f}, {max(mean_trend):.4f}]")
        print(f"  方差范围：[{min(var_trend):.4f}, {max(var_trend):.4f}]")

        if max(var_trend) > 100 or min(var_trend) < 0.001:
            print("  警告：方差超出正常范围")
```

---

## 延伸阅读

继续使用这些 Code Wiki 资源学习：

**相关主题：**
- 深度学习基础
- 神经网络优化
- 迁移学习技术
- 模型压缩和量化

**高级正则化：**
- 随机深度和 DropPath
- Shake-Shake 和 ShakeDrop
- 谱归一化
- 对抗训练

**外部资源：**
- "Dropout: A Simple Way to Prevent Neural Networks from Overfitting" (Srivastava 等人，2014)
- "Batch Normalization: Accelerating Deep Network Training" (Ioffe 和 Szegedy，2015)
- "Layer Normalization" (Ba 等人，2016)
- "mixup: Beyond Empirical Risk Minimization" (Zhang 等人，2018)
- "CutMix: Regularization Strategy to Train Strong Classifiers" (Yun 等人，2019)

正则化对于训练能够很好泛化的深度神经网络至关重要。关键是理解何时以及如何应用每种技术，以及它们如何相互作用。从基础开始（BatchNorm、Dropout、权重衰减），添加数据增强，并根据需要尝试 Mixup 等高级技术。始终监控训练和验证指标，以找到欠拟合和过拟合之间的正确平衡。
