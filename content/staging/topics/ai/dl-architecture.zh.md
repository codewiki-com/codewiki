---
title: "Deep Learning Advanced: Network Architecture Design"
description: "Master modern neural network architectures: ResNet, DenseNet, EfficientNet, and NAS"
track: ai
section: deep-learning
difficulty: advanced
tags:
  - neural networks
  - ResNet
  - architecture
  - deep learning
status: imported
origin: old/src/content/docs/datascience/dl-architecture.zh.md
divergence: 0.202
issues:
  - title-lang-zh
  - title-language
legacy:
  category: DataScience
  subcategory: DeepLearning
  order: 17
  lastUpdated: 2026-01-07
---

神经网络架构的设计是决定深度学习应用成功与否的最关键因素之一。在过去十年中，研究人员开发了越来越复杂的架构，以克服训练深度网络时面临的基本挑战。本综合指南将探讨神经网络架构的演进历程，从深度网络面临的挑战到视觉 Transformer 和神经架构搜索等现代创新技术。

## 深度神经网络的挑战

在深入了解具体架构之前，必须先理解促使这些架构发展的基本问题。

### 梯度消失问题

当使用反向传播训练深度网络时，梯度必须通过多个层向后传播。在使用传统激活函数（如 sigmoid 或 tanh）的网络中，梯度在逐层传播过程中往往会呈指数级衰减。

**数学分析：**

对于 sigmoid 激活函数，其导数为：

$$\sigma'(x) = \sigma(x)(1 - \sigma(x))$$

该导数的最大值为 0.25（当 x = 0 时）。对于一个具有 n 层的网络，梯度可能会缩小 (0.25)^n 倍，对于深度网络来说变得微乎其微。

```python
import torch
import torch.nn as nn
import matplotlib.pyplot as plt
import numpy as np

def demonstrate_vanishing_gradients():
    """可视化深度网络中的梯度消失现象。"""

    class DeepNetwork(nn.Module):
        def __init__(self, num_layers, activation='sigmoid'):
            super().__init__()
            layers = []
            for _ in range(num_layers):
                layers.append(nn.Linear(100, 100))
                if activation == 'sigmoid':
                    layers.append(nn.Sigmoid())
                elif activation == 'relu':
                    layers.append(nn.ReLU())
            self.network = nn.Sequential(*layers)

        def forward(self, x):
            return self.network(x)

    # 比较梯度大小
    results = {'sigmoid': [], 'relu': []}

    for activation in ['sigmoid', 'relu']:
        for num_layers in range(5, 51, 5):
            model = DeepNetwork(num_layers, activation)
            x = torch.randn(32, 100, requires_grad=True)
            output = model(x)
            loss = output.sum()
            loss.backward()

            # 获取第一层的梯度
            first_layer_grad = list(model.parameters())[0].grad
            grad_magnitude = first_layer_grad.abs().mean().item()
            results[activation].append(grad_magnitude)

    # 绘制结果
    layers = list(range(5, 51, 5))
    plt.figure(figsize=(10, 6))
    plt.semilogy(layers, results['sigmoid'], 'o-', label='Sigmoid')
    plt.semilogy(layers, results['relu'], 's-', label='ReLU')
    plt.xlabel('Number of Layers')
    plt.ylabel('Gradient Magnitude (log scale)')
    plt.title('Gradient Vanishing: Sigmoid vs ReLU')
    plt.legend()
    plt.grid(True)
    plt.show()

demonstrate_vanishing_gradients()
```

### 退化问题

出人意料的是，向网络添加更多层可能导致更高的训练误差，而不仅仅是更高的测试误差。这种退化不是由过拟合引起的，而是由优化困难造成的。

```python
import torch
import torch.nn as nn
import torch.optim as optim

def demonstrate_degradation():
    """展示更深的普通网络性能可能更差的现象。"""

    class PlainNetwork(nn.Module):
        def __init__(self, num_blocks):
            super().__init__()
            self.conv1 = nn.Conv2d(1, 64, 3, padding=1)
            self.bn1 = nn.BatchNorm2d(64)

            # 堆叠的卷积块
            blocks = []
            for _ in range(num_blocks):
                blocks.extend([
                    nn.Conv2d(64, 64, 3, padding=1),
                    nn.BatchNorm2d(64),
                    nn.ReLU()
                ])
            self.blocks = nn.Sequential(*blocks)

            self.pool = nn.AdaptiveAvgPool2d(1)
            self.fc = nn.Linear(64, 10)

        def forward(self, x):
            x = torch.relu(self.bn1(self.conv1(x)))
            x = self.blocks(x)
            x = self.pool(x)
            x = x.view(x.size(0), -1)
            return self.fc(x)

    return PlainNetwork
```

### 计算效率挑战

随着网络变得更深更宽，计算成本急剧增加：

- **内存**：必须存储激活图用于反向传播
- **计算量**：浮点运算次数（FLOPs）随网络规模增长
- **延迟**：推理时间影响实际部署

| 网络 | 参数量 | FLOPs | Top-1 准确率 |
|---------|------------|-------|----------------|
| VGG-16 | 138M | 15.5B | 71.5% |
| ResNet-50 | 25.6M | 4.1B | 76.1% |
| EfficientNet-B0 | 5.3M | 0.4B | 77.1% |
| EfficientNet-B7 | 66M | 37B | 84.3% |

## ResNet：残差连接

ResNet（残差网络）由 He 等人于 2015 年提出，通过实现数百甚至数千层网络的训练，彻底改变了深度学习领域。

### 跳跃连接的概念

核心创新是残差块，它将输入直接添加到输出：

$$y = F(x, \{W_i\}) + x$$

网络不直接学习期望的映射 H(x)，而是学习残差 F(x) = H(x) - x。如果最优变换接近恒等映射，学习 F(x) 约等于 0 比学习 H(x) 约等于 x 更容易。

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class BasicBlock(nn.Module):
    """ResNet-18/34 的基本残差块。"""

    expansion = 1

    def __init__(self, in_channels, out_channels, stride=1, downsample=None):
        super().__init__()

        # 第一个卷积层
        self.conv1 = nn.Conv2d(
            in_channels, out_channels, kernel_size=3,
            stride=stride, padding=1, bias=False
        )
        self.bn1 = nn.BatchNorm2d(out_channels)

        # 第二个卷积层
        self.conv2 = nn.Conv2d(
            out_channels, out_channels, kernel_size=3,
            stride=1, padding=1, bias=False
        )
        self.bn2 = nn.BatchNorm2d(out_channels)

        # 用于维度匹配的下采样层
        self.downsample = downsample
        self.stride = stride

    def forward(self, x):
        identity = x

        # 主路径
        out = self.conv1(x)
        out = self.bn1(out)
        out = F.relu(out)

        out = self.conv2(out)
        out = self.bn2(out)

        # 捷径路径
        if self.downsample is not None:
            identity = self.downsample(x)

        # 添加残差连接
        out += identity
        out = F.relu(out)

        return out


class Bottleneck(nn.Module):
    """ResNet-50/101/152 的瓶颈残差块。"""

    expansion = 4

    def __init__(self, in_channels, out_channels, stride=1, downsample=None):
        super().__init__()

        # 1x1 卷积用于降维
        self.conv1 = nn.Conv2d(in_channels, out_channels, kernel_size=1, bias=False)
        self.bn1 = nn.BatchNorm2d(out_channels)

        # 3x3 卷积
        self.conv2 = nn.Conv2d(
            out_channels, out_channels, kernel_size=3,
            stride=stride, padding=1, bias=False
        )
        self.bn2 = nn.BatchNorm2d(out_channels)

        # 1x1 卷积用于恢复维度
        self.conv3 = nn.Conv2d(
            out_channels, out_channels * self.expansion,
            kernel_size=1, bias=False
        )
        self.bn3 = nn.BatchNorm2d(out_channels * self.expansion)

        self.downsample = downsample
        self.stride = stride

    def forward(self, x):
        identity = x

        out = F.relu(self.bn1(self.conv1(x)))
        out = F.relu(self.bn2(self.conv2(out)))
        out = self.bn3(self.conv3(out))

        if self.downsample is not None:
            identity = self.downsample(x)

        out += identity
        out = F.relu(out)

        return out
```

### 完整的 ResNet 实现

```python
import torch
import torch.nn as nn

class ResNet(nn.Module):
    """完整的 ResNet 实现。"""

    def __init__(self, block, layers, num_classes=1000, zero_init_residual=True):
        super().__init__()

        self.in_channels = 64

        # 初始卷积
        self.conv1 = nn.Conv2d(3, 64, kernel_size=7, stride=2, padding=3, bias=False)
        self.bn1 = nn.BatchNorm2d(64)
        self.relu = nn.ReLU(inplace=True)
        self.maxpool = nn.MaxPool2d(kernel_size=3, stride=2, padding=1)

        # 残差层
        self.layer1 = self._make_layer(block, 64, layers[0])
        self.layer2 = self._make_layer(block, 128, layers[1], stride=2)
        self.layer3 = self._make_layer(block, 256, layers[2], stride=2)
        self.layer4 = self._make_layer(block, 512, layers[3], stride=2)

        # 分类头
        self.avgpool = nn.AdaptiveAvgPool2d((1, 1))
        self.fc = nn.Linear(512 * block.expansion, num_classes)

        # 权重初始化
        self._initialize_weights(zero_init_residual)

    def _make_layer(self, block, out_channels, blocks, stride=1):
        downsample = None

        # 如果步长不为 1 或通道数不匹配则进行下采样
        if stride != 1 or self.in_channels != out_channels * block.expansion:
            downsample = nn.Sequential(
                nn.Conv2d(
                    self.in_channels, out_channels * block.expansion,
                    kernel_size=1, stride=stride, bias=False
                ),
                nn.BatchNorm2d(out_channels * block.expansion),
            )

        layers = []
        layers.append(block(self.in_channels, out_channels, stride, downsample))
        self.in_channels = out_channels * block.expansion

        for _ in range(1, blocks):
            layers.append(block(self.in_channels, out_channels))

        return nn.Sequential(*layers)

    def _initialize_weights(self, zero_init_residual):
        for m in self.modules():
            if isinstance(m, nn.Conv2d):
                nn.init.kaiming_normal_(m.weight, mode='fan_out', nonlinearity='relu')
            elif isinstance(m, nn.BatchNorm2d):
                nn.init.constant_(m.weight, 1)
                nn.init.constant_(m.bias, 0)

        # 将每个残差分支中最后一个 BN 的权重初始化为零
        if zero_init_residual:
            for m in self.modules():
                if isinstance(m, Bottleneck):
                    nn.init.constant_(m.bn3.weight, 0)
                elif isinstance(m, BasicBlock):
                    nn.init.constant_(m.bn2.weight, 0)

    def forward(self, x):
        x = self.conv1(x)
        x = self.bn1(x)
        x = self.relu(x)
        x = self.maxpool(x)

        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)

        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        x = self.fc(x)

        return x


# 不同 ResNet 变体的工厂函数
def resnet18(num_classes=1000):
    return ResNet(BasicBlock, [2, 2, 2, 2], num_classes)

def resnet34(num_classes=1000):
    return ResNet(BasicBlock, [3, 4, 6, 3], num_classes)

def resnet50(num_classes=1000):
    return ResNet(Bottleneck, [3, 4, 6, 3], num_classes)

def resnet101(num_classes=1000):
    return ResNet(Bottleneck, [3, 4, 23, 3], num_classes)

def resnet152(num_classes=1000):
    return ResNet(Bottleneck, [3, 8, 36, 3], num_classes)


# 使用示例
if __name__ == "__main__":
    model = resnet50(num_classes=1000)
    x = torch.randn(1, 3, 224, 224)
    output = model(x)
    print(f"Output shape: {output.shape}")
    print(f"Total parameters: {sum(p.numel() for p in model.parameters()):,}")
```

### ResNet 变体与改进

**预激活 ResNet：**

```python
class PreActBlock(nn.Module):
    """预激活残差块（BN-ReLU-Conv 顺序）。"""

    expansion = 1

    def __init__(self, in_channels, out_channels, stride=1, downsample=None):
        super().__init__()

        self.bn1 = nn.BatchNorm2d(in_channels)
        self.conv1 = nn.Conv2d(
            in_channels, out_channels, kernel_size=3,
            stride=stride, padding=1, bias=False
        )
        self.bn2 = nn.BatchNorm2d(out_channels)
        self.conv2 = nn.Conv2d(
            out_channels, out_channels, kernel_size=3,
            stride=1, padding=1, bias=False
        )

        self.downsample = downsample

    def forward(self, x):
        identity = x

        out = F.relu(self.bn1(x))

        if self.downsample is not None:
            identity = self.downsample(out)

        out = self.conv1(out)
        out = self.conv2(F.relu(self.bn2(out)))

        out += identity
        return out
```

**ResNeXt（聚合残差变换）：**

```python
class ResNeXtBlock(nn.Module):
    """带分组卷积的 ResNeXt 块。"""

    expansion = 2

    def __init__(self, in_channels, out_channels, stride=1,
                 groups=32, width_per_group=4, downsample=None):
        super().__init__()

        width = int(out_channels * (width_per_group / 64.0)) * groups

        self.conv1 = nn.Conv2d(in_channels, width, kernel_size=1, bias=False)
        self.bn1 = nn.BatchNorm2d(width)

        self.conv2 = nn.Conv2d(
            width, width, kernel_size=3, stride=stride,
            padding=1, groups=groups, bias=False
        )
        self.bn2 = nn.BatchNorm2d(width)

        self.conv3 = nn.Conv2d(
            width, out_channels * self.expansion,
            kernel_size=1, bias=False
        )
        self.bn3 = nn.BatchNorm2d(out_channels * self.expansion)

        self.downsample = downsample

    def forward(self, x):
        identity = x

        out = F.relu(self.bn1(self.conv1(x)))
        out = F.relu(self.bn2(self.conv2(out)))
        out = self.bn3(self.conv3(out))

        if self.downsample is not None:
            identity = self.downsample(x)

        out += identity
        return F.relu(out)
```

## DenseNet：稠密连接

DenseNet（稠密连接网络）将跳跃连接的思想进一步发展，以前馈方式将每一层与所有其他层相连。

### 稠密块架构

在一个具有 L 层的稠密块中，存在 L(L+1)/2 个连接。每一层接收来自所有前面层的特征图：

$$x_l = H_l([x_0, x_1, ..., x_{l-1}])$$

其中 [x_0, x_1, ..., x_{l-1}] 表示所有之前特征图的拼接。

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class DenseLayer(nn.Module):
    """稠密块中的单层。"""

    def __init__(self, in_channels, growth_rate, bn_size=4, drop_rate=0.0):
        super().__init__()

        # 瓶颈层（1x1 卷积）
        self.bn1 = nn.BatchNorm2d(in_channels)
        self.conv1 = nn.Conv2d(
            in_channels, bn_size * growth_rate,
            kernel_size=1, bias=False
        )

        # 主层（3x3 卷积）
        self.bn2 = nn.BatchNorm2d(bn_size * growth_rate)
        self.conv2 = nn.Conv2d(
            bn_size * growth_rate, growth_rate,
            kernel_size=3, padding=1, bias=False
        )

        self.drop_rate = drop_rate

    def forward(self, x):
        # x 是来自所有前面层的特征图列表
        if isinstance(x, list):
            x = torch.cat(x, dim=1)

        out = self.conv1(F.relu(self.bn1(x)))
        out = self.conv2(F.relu(self.bn2(out)))

        if self.drop_rate > 0:
            out = F.dropout(out, p=self.drop_rate, training=self.training)

        return out


class DenseBlock(nn.Module):
    """包含多个稠密层的稠密块。"""

    def __init__(self, num_layers, in_channels, growth_rate, bn_size=4, drop_rate=0.0):
        super().__init__()

        self.layers = nn.ModuleList()
        for i in range(num_layers):
            layer = DenseLayer(
                in_channels + i * growth_rate,
                growth_rate,
                bn_size,
                drop_rate
            )
            self.layers.append(layer)

    def forward(self, x):
        features = [x]
        for layer in self.layers:
            new_features = layer(features)
            features.append(new_features)
        return torch.cat(features, dim=1)


class Transition(nn.Module):
    """稠密块之间的过渡层。"""

    def __init__(self, in_channels, out_channels):
        super().__init__()

        self.bn = nn.BatchNorm2d(in_channels)
        self.conv = nn.Conv2d(in_channels, out_channels, kernel_size=1, bias=False)
        self.pool = nn.AvgPool2d(kernel_size=2, stride=2)

    def forward(self, x):
        out = self.conv(F.relu(self.bn(x)))
        out = self.pool(out)
        return out
```

### 完整的 DenseNet 实现

```python
class DenseNet(nn.Module):
    """完整的 DenseNet 实现。"""

    def __init__(self, growth_rate=32, block_config=(6, 12, 24, 16),
                 num_init_features=64, bn_size=4, drop_rate=0.0,
                 num_classes=1000, compression=0.5):
        super().__init__()

        # 初始卷积
        self.features = nn.Sequential(
            nn.Conv2d(3, num_init_features, kernel_size=7, stride=2, padding=3, bias=False),
            nn.BatchNorm2d(num_init_features),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=3, stride=2, padding=1)
        )

        # 稠密块和过渡层
        num_features = num_init_features
        for i, num_layers in enumerate(block_config):
            block = DenseBlock(
                num_layers=num_layers,
                in_channels=num_features,
                growth_rate=growth_rate,
                bn_size=bn_size,
                drop_rate=drop_rate
            )
            self.features.add_module(f'denseblock{i + 1}', block)
            num_features = num_features + num_layers * growth_rate

            if i != len(block_config) - 1:
                trans = Transition(
                    in_channels=num_features,
                    out_channels=int(num_features * compression)
                )
                self.features.add_module(f'transition{i + 1}', trans)
                num_features = int(num_features * compression)

        # 最终批归一化
        self.features.add_module('norm_final', nn.BatchNorm2d(num_features))

        # 分类头
        self.classifier = nn.Linear(num_features, num_classes)

        # 权重初始化
        self._initialize_weights()

    def _initialize_weights(self):
        for m in self.modules():
            if isinstance(m, nn.Conv2d):
                nn.init.kaiming_normal_(m.weight)
            elif isinstance(m, nn.BatchNorm2d):
                nn.init.constant_(m.weight, 1)
                nn.init.constant_(m.bias, 0)
            elif isinstance(m, nn.Linear):
                nn.init.constant_(m.bias, 0)

    def forward(self, x):
        features = self.features(x)
        out = F.relu(features)
        out = F.adaptive_avg_pool2d(out, (1, 1))
        out = torch.flatten(out, 1)
        out = self.classifier(out)
        return out


# DenseNet 变体的工厂函数
def densenet121(num_classes=1000):
    return DenseNet(growth_rate=32, block_config=(6, 12, 24, 16),
                    num_init_features=64, num_classes=num_classes)

def densenet169(num_classes=1000):
    return DenseNet(growth_rate=32, block_config=(6, 12, 32, 32),
                    num_init_features=64, num_classes=num_classes)

def densenet201(num_classes=1000):
    return DenseNet(growth_rate=32, block_config=(6, 12, 48, 32),
                    num_init_features=64, num_classes=num_classes)
```

### DenseNet 的优势

**特征复用：**
- 每一层都可以访问所有之前的特征图
- 减少冗余特征学习
- 实现更高效的参数利用

**梯度流动：**
- 直接连接提供隐式的深度监督
- 梯度可以直接流向早期层
- 缓解梯度消失问题

**参数效率：**
- 比传统网络参数更少
- 增长率控制模型容量
- 过渡层中的压缩减少特征图大小

## EfficientNet：复合缩放

EfficientNet 引入了一种原则性的方法，通过平衡深度、宽度和分辨率来扩展神经网络。

### 复合缩放原理

传统方法只扩展一个维度（深度、宽度或分辨率）。EfficientNet 使用复合系数均匀扩展所有三个维度：

$$\text{深度}: d = \alpha^\phi$$
$$\text{宽度}: w = \beta^\phi$$
$$\text{分辨率}: r = \gamma^\phi$$

约束条件：alpha * beta^2 * gamma^2 约等于 2

这个约束确保对于任何新的 phi，总 FLOPs 大约翻倍。

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
import math

class SwishActivation(nn.Module):
    """Swish 激活函数：x * sigmoid(x)。"""

    def forward(self, x):
        return x * torch.sigmoid(x)


class SqueezeExcitation(nn.Module):
    """挤压激励模块。"""

    def __init__(self, in_channels, reduced_channels):
        super().__init__()

        self.se = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Conv2d(in_channels, reduced_channels, kernel_size=1),
            SwishActivation(),
            nn.Conv2d(reduced_channels, in_channels, kernel_size=1),
            nn.Sigmoid()
        )

    def forward(self, x):
        return x * self.se(x)


class MBConvBlock(nn.Module):
    """移动端倒置瓶颈卷积块。"""

    def __init__(self, in_channels, out_channels, kernel_size,
                 stride, expand_ratio, se_ratio=0.25, drop_rate=0.0):
        super().__init__()

        self.stride = stride
        self.use_residual = (stride == 1 and in_channels == out_channels)
        self.drop_rate = drop_rate

        # 扩展阶段
        hidden_dim = int(in_channels * expand_ratio)

        layers = []
        if expand_ratio != 1:
            layers.extend([
                nn.Conv2d(in_channels, hidden_dim, kernel_size=1, bias=False),
                nn.BatchNorm2d(hidden_dim),
                SwishActivation()
            ])

        # 深度卷积
        layers.extend([
            nn.Conv2d(
                hidden_dim, hidden_dim, kernel_size=kernel_size,
                stride=stride, padding=kernel_size // 2,
                groups=hidden_dim, bias=False
            ),
            nn.BatchNorm2d(hidden_dim),
            SwishActivation()
        ])

        self.expand_conv = nn.Sequential(*layers)

        # 挤压激励
        se_channels = max(1, int(in_channels * se_ratio))
        self.se = SqueezeExcitation(hidden_dim, se_channels)

        # 投影阶段
        self.project_conv = nn.Sequential(
            nn.Conv2d(hidden_dim, out_channels, kernel_size=1, bias=False),
            nn.BatchNorm2d(out_channels)
        )

    def forward(self, x):
        identity = x

        out = self.expand_conv(x)
        out = self.se(out)
        out = self.project_conv(out)

        if self.use_residual:
            if self.drop_rate > 0 and self.training:
                out = self._drop_connect(out)
            out = out + identity

        return out

    def _drop_connect(self, x):
        """Drop connect 实现。"""
        keep_prob = 1 - self.drop_rate
        batch_size = x.size(0)
        random_tensor = keep_prob + torch.rand(
            batch_size, 1, 1, 1, device=x.device
        )
        binary_mask = torch.floor(random_tensor)
        return x * binary_mask / keep_prob
```

### 完整的 EfficientNet 实现

```python
class EfficientNet(nn.Module):
    """EfficientNet 实现。"""

    # 基础架构配置（EfficientNet-B0）
    BASE_CONFIG = [
        # (expand_ratio, channels, num_layers, stride, kernel_size)
        (1, 16, 1, 1, 3),
        (6, 24, 2, 2, 3),
        (6, 40, 2, 2, 5),
        (6, 80, 3, 2, 3),
        (6, 112, 3, 1, 5),
        (6, 192, 4, 2, 5),
        (6, 320, 1, 1, 3),
    ]

    # 不同变体的缩放系数
    SCALING_COEFFICIENTS = {
        'b0': (1.0, 1.0, 224, 0.2),
        'b1': (1.0, 1.1, 240, 0.2),
        'b2': (1.1, 1.2, 260, 0.3),
        'b3': (1.2, 1.4, 300, 0.3),
        'b4': (1.4, 1.8, 380, 0.4),
        'b5': (1.6, 2.2, 456, 0.4),
        'b6': (1.8, 2.6, 528, 0.5),
        'b7': (2.0, 3.1, 600, 0.5),
    }

    def __init__(self, variant='b0', num_classes=1000):
        super().__init__()

        width_mult, depth_mult, resolution, drop_rate = self.SCALING_COEFFICIENTS[variant]

        # 缩放基础通道数
        def scale_channels(channels):
            return int(math.ceil(channels * width_mult / 8) * 8)

        # 缩放层数
        def scale_depth(num_layers):
            return int(math.ceil(num_layers * depth_mult))

        # 主干
        out_channels = scale_channels(32)
        self.stem = nn.Sequential(
            nn.Conv2d(3, out_channels, kernel_size=3, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            SwishActivation()
        )

        # 构建块
        blocks = []
        in_channels = out_channels

        for expand_ratio, channels, num_layers, stride, kernel_size in self.BASE_CONFIG:
            out_channels = scale_channels(channels)
            num_layers = scale_depth(num_layers)

            for i in range(num_layers):
                blocks.append(MBConvBlock(
                    in_channels=in_channels,
                    out_channels=out_channels,
                    kernel_size=kernel_size,
                    stride=stride if i == 0 else 1,
                    expand_ratio=expand_ratio,
                    drop_rate=drop_rate * i / (sum(scale_depth(n) for _, _, n, _, _ in self.BASE_CONFIG))
                ))
                in_channels = out_channels

        self.blocks = nn.Sequential(*blocks)

        # 头部
        head_channels = scale_channels(1280)
        self.head = nn.Sequential(
            nn.Conv2d(in_channels, head_channels, kernel_size=1, bias=False),
            nn.BatchNorm2d(head_channels),
            SwishActivation(),
            nn.AdaptiveAvgPool2d(1),
            nn.Flatten(),
            nn.Dropout(drop_rate),
            nn.Linear(head_channels, num_classes)
        )

        self._initialize_weights()

    def _initialize_weights(self):
        for m in self.modules():
            if isinstance(m, nn.Conv2d):
                nn.init.kaiming_normal_(m.weight, mode='fan_out', nonlinearity='relu')
            elif isinstance(m, nn.BatchNorm2d):
                nn.init.ones_(m.weight)
                nn.init.zeros_(m.bias)
            elif isinstance(m, nn.Linear):
                nn.init.normal_(m.weight, 0, 0.01)
                nn.init.zeros_(m.bias)

    def forward(self, x):
        x = self.stem(x)
        x = self.blocks(x)
        x = self.head(x)
        return x


# 工厂函数
def efficientnet_b0(num_classes=1000):
    return EfficientNet('b0', num_classes)

def efficientnet_b7(num_classes=1000):
    return EfficientNet('b7', num_classes)
```

## MobileNet：轻量级架构

MobileNet 专为计算资源有限的移动和嵌入式视觉应用设计。

### 深度可分离卷积

关键创新是将标准卷积分解为深度卷积和逐点卷积：

**标准卷积成本：** D_K * D_K * M * N * D_F * D_F

**深度可分离卷积成本：** D_K * D_K * M * D_F * D_F + M * N * D_F * D_F

**缩减比例：** 1/N + 1/D_K^2

对于 3x3 卷积核，计算量大约减少 8-9 倍。

```python
import torch
import torch.nn as nn

class DepthwiseSeparableConv(nn.Module):
    """深度可分离卷积。"""

    def __init__(self, in_channels, out_channels, stride=1):
        super().__init__()

        # 深度卷积
        self.depthwise = nn.Sequential(
            nn.Conv2d(
                in_channels, in_channels, kernel_size=3,
                stride=stride, padding=1, groups=in_channels, bias=False
            ),
            nn.BatchNorm2d(in_channels),
            nn.ReLU6(inplace=True)
        )

        # 逐点卷积
        self.pointwise = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, kernel_size=1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU6(inplace=True)
        )

    def forward(self, x):
        x = self.depthwise(x)
        x = self.pointwise(x)
        return x


class MobileNetV1(nn.Module):
    """MobileNet V1 实现。"""

    def __init__(self, num_classes=1000, width_mult=1.0):
        super().__init__()

        def scaled_channels(channels):
            return int(channels * width_mult)

        # 配置：(out_channels, stride)
        config = [
            (64, 1), (128, 2), (128, 1), (256, 2), (256, 1),
            (512, 2), (512, 1), (512, 1), (512, 1), (512, 1), (512, 1),
            (1024, 2), (1024, 1)
        ]

        # 初始卷积
        self.conv1 = nn.Sequential(
            nn.Conv2d(3, scaled_channels(32), kernel_size=3, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(scaled_channels(32)),
            nn.ReLU6(inplace=True)
        )

        # 深度可分离层
        layers = []
        in_channels = scaled_channels(32)
        for out_channels, stride in config:
            out_channels = scaled_channels(out_channels)
            layers.append(DepthwiseSeparableConv(in_channels, out_channels, stride))
            in_channels = out_channels

        self.features = nn.Sequential(*layers)

        # 分类头
        self.classifier = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Flatten(),
            nn.Linear(scaled_channels(1024), num_classes)
        )

    def forward(self, x):
        x = self.conv1(x)
        x = self.features(x)
        x = self.classifier(x)
        return x
```

### MobileNet V2：倒置残差

MobileNet V2 引入了带线性瓶颈的倒置残差块：

```python
class InvertedResidual(nn.Module):
    """倒置残差块（MobileNet V2）。"""

    def __init__(self, in_channels, out_channels, stride, expand_ratio):
        super().__init__()

        self.stride = stride
        self.use_residual = stride == 1 and in_channels == out_channels

        hidden_dim = int(in_channels * expand_ratio)

        layers = []

        # 扩展（如果 expand_ratio > 1）
        if expand_ratio != 1:
            layers.extend([
                nn.Conv2d(in_channels, hidden_dim, kernel_size=1, bias=False),
                nn.BatchNorm2d(hidden_dim),
                nn.ReLU6(inplace=True)
            ])

        # 深度卷积
        layers.extend([
            nn.Conv2d(
                hidden_dim, hidden_dim, kernel_size=3,
                stride=stride, padding=1, groups=hidden_dim, bias=False
            ),
            nn.BatchNorm2d(hidden_dim),
            nn.ReLU6(inplace=True)
        ])

        # 线性投影（无激活）
        layers.extend([
            nn.Conv2d(hidden_dim, out_channels, kernel_size=1, bias=False),
            nn.BatchNorm2d(out_channels)
        ])

        self.conv = nn.Sequential(*layers)

    def forward(self, x):
        if self.use_residual:
            return x + self.conv(x)
        return self.conv(x)


class MobileNetV2(nn.Module):
    """MobileNet V2 实现。"""

    def __init__(self, num_classes=1000, width_mult=1.0):
        super().__init__()

        # 配置：(expand_ratio, out_channels, num_blocks, stride)
        inverted_residual_config = [
            (1, 16, 1, 1),
            (6, 24, 2, 2),
            (6, 32, 3, 2),
            (6, 64, 4, 2),
            (6, 96, 3, 1),
            (6, 160, 3, 2),
            (6, 320, 1, 1),
        ]

        def scaled_channels(channels):
            return max(8, int(channels * width_mult + 4) // 8 * 8)

        # 初始卷积
        input_channels = scaled_channels(32)
        self.features = nn.Sequential(
            nn.Conv2d(3, input_channels, kernel_size=3, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(input_channels),
            nn.ReLU6(inplace=True)
        )

        # 倒置残差块
        for expand_ratio, out_channels, num_blocks, stride in inverted_residual_config:
            out_channels = scaled_channels(out_channels)
            for i in range(num_blocks):
                s = stride if i == 0 else 1
                self.features.add_module(
                    f'inverted_{len(self.features)}',
                    InvertedResidual(input_channels, out_channels, s, expand_ratio)
                )
                input_channels = out_channels

        # 最终卷积
        last_channels = scaled_channels(1280)
        self.features.add_module('conv_last', nn.Sequential(
            nn.Conv2d(input_channels, last_channels, kernel_size=1, bias=False),
            nn.BatchNorm2d(last_channels),
            nn.ReLU6(inplace=True)
        ))

        # 分类头
        self.classifier = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Flatten(),
            nn.Dropout(0.2),
            nn.Linear(last_channels, num_classes)
        )

    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x
```

### MobileNet V3

MobileNet V3 结合了神经架构搜索（NAS）和硬件感知优化：

```python
class HardSwish(nn.Module):
    """Hard Swish 激活函数。"""

    def forward(self, x):
        return x * F.relu6(x + 3) / 6


class HardSigmoid(nn.Module):
    """Hard Sigmoid 激活函数。"""

    def forward(self, x):
        return F.relu6(x + 3) / 6


class SEBlock(nn.Module):
    """MobileNetV3 的挤压激励模块。"""

    def __init__(self, channels, reduction=4):
        super().__init__()

        reduced_channels = channels // reduction
        self.se = nn.Sequential(
            nn.AdaptiveAvgPool2d(1),
            nn.Conv2d(channels, reduced_channels, kernel_size=1),
            nn.ReLU(inplace=True),
            nn.Conv2d(reduced_channels, channels, kernel_size=1),
            HardSigmoid()
        )

    def forward(self, x):
        return x * self.se(x)


class MobileNetV3Block(nn.Module):
    """MobileNet V3 模块。"""

    def __init__(self, in_channels, out_channels, kernel_size,
                 stride, expand_ratio, use_se, activation):
        super().__init__()

        self.stride = stride
        self.use_residual = stride == 1 and in_channels == out_channels

        hidden_dim = int(in_channels * expand_ratio)

        # 选择激活函数
        act = HardSwish() if activation == 'HS' else nn.ReLU(inplace=True)

        layers = []

        # 扩展
        if expand_ratio != 1:
            layers.extend([
                nn.Conv2d(in_channels, hidden_dim, kernel_size=1, bias=False),
                nn.BatchNorm2d(hidden_dim),
                act
            ])

        # 深度卷积
        layers.extend([
            nn.Conv2d(
                hidden_dim, hidden_dim, kernel_size=kernel_size,
                stride=stride, padding=kernel_size // 2,
                groups=hidden_dim, bias=False
            ),
            nn.BatchNorm2d(hidden_dim),
            act
        ])

        # 挤压激励
        if use_se:
            layers.append(SEBlock(hidden_dim))

        # 投影
        layers.extend([
            nn.Conv2d(hidden_dim, out_channels, kernel_size=1, bias=False),
            nn.BatchNorm2d(out_channels)
        ])

        self.conv = nn.Sequential(*layers)

    def forward(self, x):
        if self.use_residual:
            return x + self.conv(x)
        return self.conv(x)
```

## 神经架构搜索（NAS）

神经架构搜索自动化神经网络架构的设计，通常能发现超越人工设计网络的架构。

### 搜索空间定义

```python
import torch
import torch.nn as nn
import random

class NASSearchSpace:
    """定义 NAS 的搜索空间。"""

    # 可用操作
    OPERATIONS = {
        'conv_3x3': lambda C: nn.Sequential(
            nn.Conv2d(C, C, 3, padding=1, bias=False),
            nn.BatchNorm2d(C),
            nn.ReLU(inplace=True)
        ),
        'conv_5x5': lambda C: nn.Sequential(
            nn.Conv2d(C, C, 5, padding=2, bias=False),
            nn.BatchNorm2d(C),
            nn.ReLU(inplace=True)
        ),
        'sep_conv_3x3': lambda C: SeparableConv(C, C, 3),
        'sep_conv_5x5': lambda C: SeparableConv(C, C, 5),
        'dilated_conv_3x3': lambda C: nn.Sequential(
            nn.Conv2d(C, C, 3, padding=2, dilation=2, bias=False),
            nn.BatchNorm2d(C),
            nn.ReLU(inplace=True)
        ),
        'max_pool_3x3': lambda C: nn.MaxPool2d(3, stride=1, padding=1),
        'avg_pool_3x3': lambda C: nn.AvgPool2d(3, stride=1, padding=1),
        'skip_connect': lambda C: nn.Identity(),
        'none': lambda C: Zero(C)
    }

    @classmethod
    def sample_architecture(cls, num_nodes=4, channels=64):
        """从搜索空间中随机采样架构。"""
        architecture = []

        for i in range(num_nodes):
            node_connections = []
            for j in range(i + 2):  # 可以连接到输入和所有之前的节点
                op_name = random.choice(list(cls.OPERATIONS.keys()))
                node_connections.append((j, op_name))
            architecture.append(node_connections)

        return architecture


class SeparableConv(nn.Module):
    """NAS 中的可分离卷积。"""

    def __init__(self, in_channels, out_channels, kernel_size):
        super().__init__()

        padding = kernel_size // 2
        self.conv = nn.Sequential(
            nn.Conv2d(in_channels, in_channels, kernel_size,
                      padding=padding, groups=in_channels, bias=False),
            nn.Conv2d(in_channels, out_channels, 1, bias=False),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )

    def forward(self, x):
        return self.conv(x)


class Zero(nn.Module):
    """零操作（无连接）。"""

    def __init__(self, channels):
        super().__init__()
        self.channels = channels

    def forward(self, x):
        return torch.zeros_like(x)
```

### 可微架构搜索（DARTS）

DARTS 将离散的架构搜索问题松弛为连续优化问题：

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class MixedOp(nn.Module):
    """DARTS 的混合操作。"""

    def __init__(self, channels, operations):
        super().__init__()

        self.ops = nn.ModuleList()
        for op_name in operations:
            op = NASSearchSpace.OPERATIONS[op_name](channels)
            self.ops.append(op)

    def forward(self, x, weights):
        return sum(w * op(x) for w, op in zip(weights, self.ops))


class DARTSCell(nn.Module):
    """带混合操作的 DARTS 单元。"""

    def __init__(self, channels, num_nodes=4):
        super().__init__()

        self.num_nodes = num_nodes
        self.operations = list(NASSearchSpace.OPERATIONS.keys())

        # 为每条边创建混合操作
        self.edges = nn.ModuleDict()
        for i in range(num_nodes):
            for j in range(i + 2):
                edge_key = f'{j}_to_{i+2}'
                self.edges[edge_key] = MixedOp(channels, self.operations)

        # 架构参数（待优化）
        self._arch_parameters = nn.ParameterList()
        for i in range(num_nodes):
            for j in range(i + 2):
                alpha = nn.Parameter(torch.randn(len(self.operations)))
                self._arch_parameters.append(alpha)

    def forward(self, s0, s1):
        states = [s0, s1]

        param_idx = 0
        for i in range(self.num_nodes):
            # 聚合来自所有之前状态的输入
            node_inputs = []
            for j in range(len(states)):
                edge_key = f'{j}_to_{i+2}'
                weights = F.softmax(self._arch_parameters[param_idx], dim=0)
                node_inputs.append(self.edges[edge_key](states[j], weights))
                param_idx += 1

            # 对该节点的所有输入求和
            states.append(sum(node_inputs))

        # 拼接所有中间节点
        return torch.cat(states[2:], dim=1)

    def arch_parameters(self):
        return self._arch_parameters
```

### NAS 训练过程

```python
import torch.optim as optim

class DARTSTrainer:
    """DARTS 双层优化训练器。"""

    def __init__(self, model, train_loader, val_loader, device):
        self.model = model.to(device)
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.device = device

        # 模型权重优化器
        self.weight_optimizer = optim.SGD(
            model.model_parameters(),
            lr=0.025,
            momentum=0.9,
            weight_decay=3e-4
        )

        # 架构参数优化器
        self.arch_optimizer = optim.Adam(
            model.arch_parameters(),
            lr=3e-4,
            betas=(0.5, 0.999),
            weight_decay=1e-3
        )

        self.criterion = nn.CrossEntropyLoss()

    def train_epoch(self):
        self.model.train()

        train_iter = iter(self.train_loader)
        val_iter = iter(self.val_loader)

        for batch_idx in range(len(self.train_loader)):
            # 获取训练批次
            try:
                train_data, train_target = next(train_iter)
            except StopIteration:
                train_iter = iter(self.train_loader)
                train_data, train_target = next(train_iter)

            # 获取验证批次
            try:
                val_data, val_target = next(val_iter)
            except StopIteration:
                val_iter = iter(self.val_loader)
                val_data, val_target = next(val_iter)

            train_data = train_data.to(self.device)
            train_target = train_target.to(self.device)
            val_data = val_data.to(self.device)
            val_target = val_target.to(self.device)

            # 在验证数据上更新架构参数
            self.arch_optimizer.zero_grad()
            val_output = self.model(val_data)
            val_loss = self.criterion(val_output, val_target)
            val_loss.backward()
            self.arch_optimizer.step()

            # 在训练数据上更新模型权重
            self.weight_optimizer.zero_grad()
            train_output = self.model(train_data)
            train_loss = self.criterion(train_output, train_target)
            train_loss.backward()
            self.weight_optimizer.step()
```

## 视觉 Transformer（ViT）

视觉 Transformer 将最初为 NLP 设计的 Transformer 架构应用于图像分类。

### 图块嵌入

图像被分割成固定大小的图块，然后进行线性投影以创建令牌嵌入：

```python
import torch
import torch.nn as nn
import math

class PatchEmbedding(nn.Module):
    """将图像转换为图块嵌入。"""

    def __init__(self, img_size=224, patch_size=16, in_channels=3, embed_dim=768):
        super().__init__()

        self.img_size = img_size
        self.patch_size = patch_size
        self.num_patches = (img_size // patch_size) ** 2

        # 展平图块的线性投影
        self.projection = nn.Conv2d(
            in_channels, embed_dim,
            kernel_size=patch_size, stride=patch_size
        )

    def forward(self, x):
        # x: (B, C, H, W) -> (B, embed_dim, H/P, W/P)
        x = self.projection(x)
        # 展平并转置：(B, embed_dim, N) -> (B, N, embed_dim)
        x = x.flatten(2).transpose(1, 2)
        return x


class PositionalEmbedding(nn.Module):
    """可学习的位置嵌入。"""

    def __init__(self, num_patches, embed_dim):
        super().__init__()

        # +1 用于 [CLS] 令牌
        self.pos_embedding = nn.Parameter(
            torch.randn(1, num_patches + 1, embed_dim) * 0.02
        )
        self.cls_token = nn.Parameter(torch.randn(1, 1, embed_dim) * 0.02)

    def forward(self, x):
        batch_size = x.size(0)

        # 将 [CLS] 令牌扩展到批次大小
        cls_tokens = self.cls_token.expand(batch_size, -1, -1)

        # 前置 [CLS] 令牌
        x = torch.cat([cls_tokens, x], dim=1)

        # 添加位置嵌入
        x = x + self.pos_embedding
        return x
```

### 多头自注意力

```python
class MultiHeadAttention(nn.Module):
    """多头自注意力机制。"""

    def __init__(self, embed_dim, num_heads, dropout=0.0):
        super().__init__()

        self.embed_dim = embed_dim
        self.num_heads = num_heads
        self.head_dim = embed_dim // num_heads
        self.scale = self.head_dim ** -0.5

        assert self.head_dim * num_heads == embed_dim, \
            "embed_dim 必须能被 num_heads 整除"

        self.qkv = nn.Linear(embed_dim, embed_dim * 3)
        self.attn_dropout = nn.Dropout(dropout)
        self.proj = nn.Linear(embed_dim, embed_dim)
        self.proj_dropout = nn.Dropout(dropout)

    def forward(self, x):
        B, N, C = x.shape

        # 生成 Q, K, V
        qkv = self.qkv(x).reshape(B, N, 3, self.num_heads, self.head_dim)
        qkv = qkv.permute(2, 0, 3, 1, 4)  # (3, B, num_heads, N, head_dim)
        q, k, v = qkv[0], qkv[1], qkv[2]

        # 缩放点积注意力
        attn = (q @ k.transpose(-2, -1)) * self.scale
        attn = attn.softmax(dim=-1)
        attn = self.attn_dropout(attn)

        # 合并头
        x = (attn @ v).transpose(1, 2).reshape(B, N, C)
        x = self.proj(x)
        x = self.proj_dropout(x)

        return x


class TransformerBlock(nn.Module):
    """Transformer 编码器块。"""

    def __init__(self, embed_dim, num_heads, mlp_ratio=4.0, dropout=0.0):
        super().__init__()

        self.norm1 = nn.LayerNorm(embed_dim)
        self.attn = MultiHeadAttention(embed_dim, num_heads, dropout)
        self.norm2 = nn.LayerNorm(embed_dim)

        mlp_hidden_dim = int(embed_dim * mlp_ratio)
        self.mlp = nn.Sequential(
            nn.Linear(embed_dim, mlp_hidden_dim),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(mlp_hidden_dim, embed_dim),
            nn.Dropout(dropout)
        )

    def forward(self, x):
        # 预归一化架构
        x = x + self.attn(self.norm1(x))
        x = x + self.mlp(self.norm2(x))
        return x
```

### 完整的视觉 Transformer

```python
class VisionTransformer(nn.Module):
    """视觉 Transformer（ViT）实现。"""

    def __init__(
        self,
        img_size=224,
        patch_size=16,
        in_channels=3,
        num_classes=1000,
        embed_dim=768,
        depth=12,
        num_heads=12,
        mlp_ratio=4.0,
        dropout=0.0,
        attn_dropout=0.0
    ):
        super().__init__()

        self.num_classes = num_classes
        self.embed_dim = embed_dim

        # 图块嵌入
        self.patch_embed = PatchEmbedding(
            img_size, patch_size, in_channels, embed_dim
        )
        num_patches = self.patch_embed.num_patches

        # 位置嵌入和 [CLS] 令牌
        self.pos_embed = PositionalEmbedding(num_patches, embed_dim)
        self.pos_dropout = nn.Dropout(dropout)

        # Transformer 编码器
        self.blocks = nn.Sequential(*[
            TransformerBlock(embed_dim, num_heads, mlp_ratio, dropout)
            for _ in range(depth)
        ])

        # 分类头
        self.norm = nn.LayerNorm(embed_dim)
        self.head = nn.Linear(embed_dim, num_classes)

        self._initialize_weights()

    def _initialize_weights(self):
        # 像线性层一样初始化图块嵌入
        w = self.patch_embed.projection.weight.data
        nn.init.xavier_uniform_(w.view([w.shape[0], -1]))

        # 初始化分类头
        nn.init.zeros_(self.head.weight)
        nn.init.zeros_(self.head.bias)

    def forward(self, x):
        # 图块嵌入
        x = self.patch_embed(x)

        # 添加位置嵌入和 [CLS] 令牌
        x = self.pos_embed(x)
        x = self.pos_dropout(x)

        # Transformer 编码器
        x = self.blocks(x)

        # 使用 [CLS] 令牌进行分类
        x = self.norm(x)
        cls_token = x[:, 0]
        x = self.head(cls_token)

        return x


# ViT 变体的工厂函数
def vit_base_patch16(num_classes=1000):
    """带 16x16 图块的 ViT-Base。"""
    return VisionTransformer(
        patch_size=16, embed_dim=768, depth=12,
        num_heads=12, num_classes=num_classes
    )

def vit_large_patch16(num_classes=1000):
    """带 16x16 图块的 ViT-Large。"""
    return VisionTransformer(
        patch_size=16, embed_dim=1024, depth=24,
        num_heads=16, num_classes=num_classes
    )

def vit_huge_patch14(num_classes=1000):
    """带 14x14 图块的 ViT-Huge。"""
    return VisionTransformer(
        img_size=224, patch_size=14, embed_dim=1280,
        depth=32, num_heads=16, num_classes=num_classes
    )
```

## 实践实现指南

### 训练现代架构

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from torch.cuda.amp import GradScaler, autocast

class ModelTrainer:
    """现代架构的完整训练流程。"""

    def __init__(self, model, device='cuda'):
        self.model = model.to(device)
        self.device = device
        self.scaler = GradScaler()  # 用于混合精度训练

    def get_optimizer(self, lr=0.001, weight_decay=0.05):
        """带分层学习率衰减的 AdamW 优化器。"""

        # 分离参数用于权重衰减
        decay_params = []
        no_decay_params = []

        for name, param in self.model.named_parameters():
            if not param.requires_grad:
                continue
            if 'bias' in name or 'norm' in name or 'bn' in name:
                no_decay_params.append(param)
            else:
                decay_params.append(param)

        return optim.AdamW([
            {'params': decay_params, 'weight_decay': weight_decay},
            {'params': no_decay_params, 'weight_decay': 0.0}
        ], lr=lr)

    def get_scheduler(self, optimizer, epochs, warmup_epochs=5):
        """带预热的余弦退火调度器。"""

        def lr_lambda(epoch):
            if epoch < warmup_epochs:
                return epoch / warmup_epochs
            return 0.5 * (1 + math.cos(math.pi * (epoch - warmup_epochs) / (epochs - warmup_epochs)))

        return optim.lr_scheduler.LambdaLR(optimizer, lr_lambda)

    def train_epoch(self, train_loader, optimizer, criterion):
        self.model.train()
        total_loss = 0
        correct = 0
        total = 0

        for batch_idx, (data, target) in enumerate(train_loader):
            data, target = data.to(self.device), target.to(self.device)

            optimizer.zero_grad()

            # 混合精度训练
            with autocast():
                output = self.model(data)
                loss = criterion(output, target)

            self.scaler.scale(loss).backward()
            self.scaler.step(optimizer)
            self.scaler.update()

            total_loss += loss.item()
            _, predicted = output.max(1)
            total += target.size(0)
            correct += predicted.eq(target).sum().item()

        return total_loss / len(train_loader), 100. * correct / total

    @torch.no_grad()
    def evaluate(self, val_loader, criterion):
        self.model.eval()
        total_loss = 0
        correct = 0
        total = 0

        for data, target in val_loader:
            data, target = data.to(self.device), target.to(self.device)

            with autocast():
                output = self.model(data)
                loss = criterion(output, target)

            total_loss += loss.item()
            _, predicted = output.max(1)
            total += target.size(0)
            correct += predicted.eq(target).sum().item()

        return total_loss / len(val_loader), 100. * correct / total
```

### 迁移学习与微调

```python
import torchvision.models as models

def load_pretrained_model(model_name, num_classes, freeze_backbone=True):
    """加载并修改预训练模型。"""

    if model_name == 'resnet50':
        model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V2)

        # 冻结主干网络
        if freeze_backbone:
            for param in model.parameters():
                param.requires_grad = False

        # 替换分类器
        num_features = model.fc.in_features
        model.fc = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(num_features, num_classes)
        )

    elif model_name == 'efficientnet_b0':
        model = models.efficientnet_b0(weights=models.EfficientNet_B0_Weights.IMAGENET1K_V1)

        if freeze_backbone:
            for param in model.features.parameters():
                param.requires_grad = False

        num_features = model.classifier[1].in_features
        model.classifier = nn.Sequential(
            nn.Dropout(0.2),
            nn.Linear(num_features, num_classes)
        )

    elif model_name == 'vit_b_16':
        model = models.vit_b_16(weights=models.ViT_B_16_Weights.IMAGENET1K_V1)

        if freeze_backbone:
            for param in model.encoder.parameters():
                param.requires_grad = False

        num_features = model.heads.head.in_features
        model.heads.head = nn.Linear(num_features, num_classes)

    return model
```

## 架构比较

### 性能比较表

| 架构 | 参数量 | FLOPs | Top-1 准确率 | Top-5 准确率 | 核心创新 |
|--------------|------------|-------|-----------|-----------|----------------|
| VGG-16 | 138M | 15.5B | 71.5% | 90.1% | 深层网络 |
| ResNet-50 | 25.6M | 4.1B | 76.1% | 92.9% | 跳跃连接 |
| ResNet-152 | 60.2M | 11.5B | 78.3% | 94.2% | 更深的残差 |
| DenseNet-121 | 8.0M | 2.9B | 74.4% | 91.9% | 稠密连接 |
| DenseNet-264 | 33.3M | 5.8B | 77.8% | 93.9% | 更深的稠密 |
| MobileNet V2 | 3.4M | 0.3B | 72.0% | 90.3% | 倒置残差 |
| MobileNet V3 | 5.4M | 0.2B | 75.2% | 92.2% | NAS + SE |
| EfficientNet-B0 | 5.3M | 0.4B | 77.1% | 93.3% | 复合缩放 |
| EfficientNet-B7 | 66M | 37B | 84.3% | 97.0% | 大型复合 |
| ViT-B/16 | 86M | 17.6B | 81.8% | 96.1% | 纯注意力 |
| ViT-L/16 | 307M | 63.6B | 85.2% | 97.2% | 大型 Transformer |

### 如何选择架构

```python
def recommend_architecture(constraints):
    """根据部署约束推荐架构。"""

    recommendations = {
        'mobile': {
            'architecture': 'MobileNet V3',
            'reason': '针对移动部署优化，延迟最小',
            'variants': ['MobileNetV3-Small', 'MobileNetV3-Large']
        },
        'edge': {
            'architecture': 'EfficientNet-B0/B1',
            'reason': '边缘设备的最佳准确率-效率权衡',
            'variants': ['EfficientNet-B0', 'EfficientNet-Lite']
        },
        'server': {
            'architecture': 'EfficientNet-B4+/ResNet-152',
            'reason': '服务器级硬件上的最高准确率',
            'variants': ['EfficientNet-B7', 'ResNet-152', 'ViT-L']
        },
        'transfer_learning': {
            'architecture': 'ResNet-50/EfficientNet-B0',
            'reason': '研究充分，有许多预训练变体可用',
            'variants': ['ResNet-50', 'EfficientNet-B0', 'ViT-B/16']
        },
        'small_dataset': {
            'architecture': '带强数据增强的 ResNet',
            'reason': 'CNN 对有限数据有更好的归纳偏置',
            'variants': ['ResNet-18', 'ResNet-34', 'EfficientNet-B0']
        },
        'large_dataset': {
            'architecture': '视觉 Transformer',
            'reason': 'Transformer 在充足训练数据下表现出色',
            'variants': ['ViT-B/16', 'ViT-L/16', 'DeiT']
        }
    }

    return recommendations.get(constraints, recommendations['server'])
```

## 面试要点

### 常见面试问题

**问题 1：解释梯度消失问题以及 ResNet 如何解决它。**

梯度消失问题发生在反向传播过程中梯度通过深度网络传播时变得极其小。这是因为梯度在每一层都要乘以权重和激活函数的导数。使用 sigmoid/tanh 激活时，导数总是小于 1，导致梯度消失。

ResNet 通过引入跳跃连接（残差连接）来解决这个问题。网络不直接学习 H(x)，而是学习 F(x) = H(x) - x，输出为 F(x) + x。在反向传播时，梯度可以直接通过跳跃连接流动，提供一条绕过非线性的"梯度高速公路"。这使得训练数百层的网络成为可能。

**问题 2：比较 DenseNet 和 ResNet。什么时候你会优先选择其中之一？**

| 方面 | ResNet | DenseNet |
|--------|--------|----------|
| 连接方式 | 恒等捷径 | 块内全连接 |
| 特征复用 | 隐式 | 显式拼接 |
| 参数量 | 更多 | 更少（相同深度下） |
| 内存 | 更低 | 更高（存储所有特征） |
| 梯度流 | 通过捷径 | 直接到所有层 |

选择 ResNet 的情况：内存受限、需要更快推理、或使用非常深的网络（>200 层）。

选择 DenseNet 的情况：参数效率重要、处理较小数据集（更好的特征复用有助于泛化）、或计算资源允许内存开销。

**问题 3：EfficientNet 中的复合缩放是如何工作的？**

EfficientNet 在三个维度上均匀缩放网络：
- 深度（层数）：d = alpha^phi
- 宽度（每层通道数）：w = beta^phi
- 分辨率（输入图像大小）：r = gamma^phi

约束条件 alpha * beta^2 * gamma^2 约等于 2 确保每增加一个 phi 单位，FLOPs 大约翻倍。对于 EfficientNet：alpha = 1.2，beta = 1.1，gamma = 1.15。

这种方法优于仅缩放单一维度，因为：
1. 更高分辨率需要更多层来捕获不同尺度的模式
2. 更多层需要更多通道来有效传播特征
3. 平衡缩放实现每 FLOP 更高的准确率

**问题 4：解释 CNN 和视觉 Transformer 之间的主要区别。**

| 方面 | CNN | 视觉 Transformer |
|--------|------|---------------------|
| 归纳偏置 | 局部连接、平移等变性 | 最小（从数据中学习） |
| 感受野 | 随深度增长 | 从第一层就是全局的 |
| 数据效率 | 小数据集表现更好 | 需要大数据集 |
| 计算扩展 | 对图像高效 | 与序列长度成平方关系 |
| 位置编码 | 隐式（通过卷积） | 显式（学习或固定） |

视觉 Transformer 缺乏 CNN 的强归纳偏置（局部性、平移不变性）。这意味着：
- 它们需要更多数据从头学习空间关系
- 但当数据充足时可以学习更灵活的模式
- 从第一层就能捕获全局上下文，对某些任务有益

**问题 5：什么是神经架构搜索，DARTS 是如何工作的？**

神经架构搜索（NAS）自动化神经网络架构的设计。DARTS（可微架构搜索）通过以下方式使 NAS 高效：

1. **连续松弛**：DARTS 不使用离散的架构选择，而是使用所有可能操作的加权和，权重（架构参数）可学习。

2. **双层优化**：
   - 内循环：在训练数据上优化网络权重
   - 外循环：在验证数据上优化架构参数

3. **推导最终架构**：训练后，为每条边选择架构权重最高的操作。

DARTS 通过避免离散搜索并使用梯度下降，将搜索时间从数千 GPU 天减少到几个 GPU 天。

### 实践技巧总结

1. **从简单开始**：在尝试自定义设计之前，先从成熟的架构（ResNet-50、EfficientNet-B0）开始。

2. **考虑部署**：根据目标平台（移动端、边缘设备、服务器）选择架构。

3. **使用预训练模型**：从 ImageNet 预训练模型迁移学习可显著提高性能和训练速度。

4. **架构与数据匹配**：小数据集使用 CNN；大数据集考虑 ViT。

5. **先分析再优化**：测量实际延迟，而不仅仅是 FLOPs，因为不同操作的硬件效率不同。

6. **正则化很重要**：现代架构受益于强数据增强（RandAugment、MixUp）和正则化（DropPath、标签平滑）。

7. **学习率调度**：使用预热加余弦退火来稳定训练深度网络。

8. **混合精度**：在现代 GPU 上启用 FP16 训练以加快训练速度并降低内存使用。

## 总结

在过去十年中，神经网络架构设计有了显著发展，这得益于对训练更深网络、提高效率和实现更好性能的需求驱动。本指南的关键要点：

1. **残差连接（ResNet）**：跳跃连接通过提供梯度高速公路并使恒等映射易于学习，实现了非常深的网络训练。

2. **稠密连接（DenseNet）**：将每一层与所有后续层连接，促进特征复用并提高参数效率。

3. **复合缩放（EfficientNet）**：平衡缩放深度、宽度和分辨率，比单维度缩放实现更好的准确率-效率权衡。

4. **轻量级架构（MobileNet）**：深度可分离卷积和倒置残差使得在资源受限设备上部署成为可能。

5. **神经架构搜索**：自动化架构设计可以发现超越人工设计的网络，DARTS 使搜索在计算上可行。

6. **视觉 Transformer**：将自注意力应用于图像，当有足够训练数据时可达到最先进的结果。

架构的选择应基于：
- 可用计算资源（训练和推理）
- 数据集大小和特性
- 部署约束（延迟、内存、功耗）
- 任务需求（准确率、可解释性）

理解这些架构创新及其权衡对任何深度学习从业者都至关重要。随着该领域继续发展，新架构将不断涌现，但高效梯度流、特征复用和平衡缩放的基本原则将保持其相关性。
