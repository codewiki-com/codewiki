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
origin: old/src/content/docs/datascience/dl-architecture.en.md
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

The design of neural network architectures is one of the most critical factors determining the success of deep learning applications. Over the past decade, researchers have developed increasingly sophisticated architectures that overcome fundamental challenges in training deep networks. This comprehensive guide explores the evolution of neural network architectures, from the challenges of deep networks to modern innovations like Vision Transformers and Neural Architecture Search.

## Challenges in Deep Neural Networks

Before diving into specific architectures, it is essential to understand the fundamental problems that motivated their development.

### The Vanishing Gradient Problem

When training deep networks using backpropagation, gradients must flow backward through many layers. In networks with traditional activation functions like sigmoid or tanh, gradients tend to shrink exponentially as they propagate through layers.

**Mathematical Analysis:**

For a sigmoid activation function, the derivative is:

$$\sigma'(x) = \sigma(x)(1 - \sigma(x))$$

The maximum value of this derivative is 0.25 (when x = 0). For a network with n layers, gradients can shrink by a factor of (0.25)^n, becoming negligibly small for deep networks.

```python
import torch
import torch.nn as nn
import matplotlib.pyplot as plt
import numpy as np

def demonstrate_vanishing_gradients():
    """Visualize gradient vanishing in deep networks."""

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

    # Compare gradient magnitudes
    results = {'sigmoid': [], 'relu': []}

    for activation in ['sigmoid', 'relu']:
        for num_layers in range(5, 51, 5):
            model = DeepNetwork(num_layers, activation)
            x = torch.randn(32, 100, requires_grad=True)
            output = model(x)
            loss = output.sum()
            loss.backward()

            # Get gradient of first layer
            first_layer_grad = list(model.parameters())[0].grad
            grad_magnitude = first_layer_grad.abs().mean().item()
            results[activation].append(grad_magnitude)

    # Plot results
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

### The Degradation Problem

Counter-intuitively, adding more layers to a network can lead to higher training error, not just higher test error. This degradation is not caused by overfitting but by optimization difficulties.

```python
import torch
import torch.nn as nn
import torch.optim as optim

def demonstrate_degradation():
    """Show how deeper plain networks can perform worse."""

    class PlainNetwork(nn.Module):
        def __init__(self, num_blocks):
            super().__init__()
            self.conv1 = nn.Conv2d(1, 64, 3, padding=1)
            self.bn1 = nn.BatchNorm2d(64)

            # Stack of convolutional blocks
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

### Computational Efficiency Challenges

As networks grow deeper and wider, computational costs increase dramatically:

- **Memory**: Activation maps must be stored for backpropagation
- **Computation**: FLOPs scale with network size
- **Latency**: Inference time impacts real-world deployment

| Network | Parameters | FLOPs | Top-1 Accuracy |
|---------|------------|-------|----------------|
| VGG-16 | 138M | 15.5B | 71.5% |
| ResNet-50 | 25.6M | 4.1B | 76.1% |
| EfficientNet-B0 | 5.3M | 0.4B | 77.1% |
| EfficientNet-B7 | 66M | 37B | 84.3% |

## ResNet: Residual Connections

ResNet (Residual Network), introduced by He et al. in 2015, revolutionized deep learning by enabling training of networks with hundreds or even thousands of layers.

### The Skip Connection Concept

The core innovation is the residual block, which adds the input directly to the output:

$$y = F(x, \{W_i\}) + x$$

Instead of learning the desired mapping H(x) directly, the network learns the residual F(x) = H(x) - x. If the optimal transformation is close to identity, learning F(x) approximately equal to 0 is easier than learning H(x) approximately equal to x.

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class BasicBlock(nn.Module):
    """Basic residual block for ResNet-18/34."""

    expansion = 1

    def __init__(self, in_channels, out_channels, stride=1, downsample=None):
        super().__init__()

        # First convolutional layer
        self.conv1 = nn.Conv2d(
            in_channels, out_channels, kernel_size=3,
            stride=stride, padding=1, bias=False
        )
        self.bn1 = nn.BatchNorm2d(out_channels)

        # Second convolutional layer
        self.conv2 = nn.Conv2d(
            out_channels, out_channels, kernel_size=3,
            stride=1, padding=1, bias=False
        )
        self.bn2 = nn.BatchNorm2d(out_channels)

        # Downsample layer for dimension matching
        self.downsample = downsample
        self.stride = stride

    def forward(self, x):
        identity = x

        # Main path
        out = self.conv1(x)
        out = self.bn1(out)
        out = F.relu(out)

        out = self.conv2(out)
        out = self.bn2(out)

        # Shortcut path
        if self.downsample is not None:
            identity = self.downsample(x)

        # Add residual connection
        out += identity
        out = F.relu(out)

        return out


class Bottleneck(nn.Module):
    """Bottleneck residual block for ResNet-50/101/152."""

    expansion = 4

    def __init__(self, in_channels, out_channels, stride=1, downsample=None):
        super().__init__()

        # 1x1 convolution to reduce dimensions
        self.conv1 = nn.Conv2d(in_channels, out_channels, kernel_size=1, bias=False)
        self.bn1 = nn.BatchNorm2d(out_channels)

        # 3x3 convolution
        self.conv2 = nn.Conv2d(
            out_channels, out_channels, kernel_size=3,
            stride=stride, padding=1, bias=False
        )
        self.bn2 = nn.BatchNorm2d(out_channels)

        # 1x1 convolution to restore dimensions
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

### Complete ResNet Implementation

```python
import torch
import torch.nn as nn

class ResNet(nn.Module):
    """Complete ResNet implementation."""

    def __init__(self, block, layers, num_classes=1000, zero_init_residual=True):
        super().__init__()

        self.in_channels = 64

        # Initial convolution
        self.conv1 = nn.Conv2d(3, 64, kernel_size=7, stride=2, padding=3, bias=False)
        self.bn1 = nn.BatchNorm2d(64)
        self.relu = nn.ReLU(inplace=True)
        self.maxpool = nn.MaxPool2d(kernel_size=3, stride=2, padding=1)

        # Residual layers
        self.layer1 = self._make_layer(block, 64, layers[0])
        self.layer2 = self._make_layer(block, 128, layers[1], stride=2)
        self.layer3 = self._make_layer(block, 256, layers[2], stride=2)
        self.layer4 = self._make_layer(block, 512, layers[3], stride=2)

        # Classification head
        self.avgpool = nn.AdaptiveAvgPool2d((1, 1))
        self.fc = nn.Linear(512 * block.expansion, num_classes)

        # Weight initialization
        self._initialize_weights(zero_init_residual)

    def _make_layer(self, block, out_channels, blocks, stride=1):
        downsample = None

        # Downsample if stride != 1 or channel mismatch
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

        # Zero-initialize the last BN in each residual branch
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


# Factory functions for different ResNet variants
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


# Example usage
if __name__ == "__main__":
    model = resnet50(num_classes=1000)
    x = torch.randn(1, 3, 224, 224)
    output = model(x)
    print(f"Output shape: {output.shape}")
    print(f"Total parameters: {sum(p.numel() for p in model.parameters()):,}")
```

### ResNet Variants and Improvements

**Pre-activation ResNet:**

```python
class PreActBlock(nn.Module):
    """Pre-activation residual block (BN-ReLU-Conv order)."""

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

**ResNeXt (Aggregated Residual Transformations):**

```python
class ResNeXtBlock(nn.Module):
    """ResNeXt block with grouped convolutions."""

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

## DenseNet: Dense Connections

DenseNet (Densely Connected Network) takes the skip connection idea further by connecting each layer to every other layer in a feed-forward fashion.

### Dense Block Architecture

In a dense block with L layers, there are L(L+1)/2 connections. Each layer receives feature maps from all preceding layers:

$$x_l = H_l([x_0, x_1, ..., x_{l-1}])$$

where [x_0, x_1, ..., x_{l-1}] denotes concatenation of all previous feature maps.

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class DenseLayer(nn.Module):
    """Single layer in a dense block."""

    def __init__(self, in_channels, growth_rate, bn_size=4, drop_rate=0.0):
        super().__init__()

        # Bottleneck layer (1x1 conv)
        self.bn1 = nn.BatchNorm2d(in_channels)
        self.conv1 = nn.Conv2d(
            in_channels, bn_size * growth_rate,
            kernel_size=1, bias=False
        )

        # Main layer (3x3 conv)
        self.bn2 = nn.BatchNorm2d(bn_size * growth_rate)
        self.conv2 = nn.Conv2d(
            bn_size * growth_rate, growth_rate,
            kernel_size=3, padding=1, bias=False
        )

        self.drop_rate = drop_rate

    def forward(self, x):
        # x is a list of feature maps from all previous layers
        if isinstance(x, list):
            x = torch.cat(x, dim=1)

        out = self.conv1(F.relu(self.bn1(x)))
        out = self.conv2(F.relu(self.bn2(out)))

        if self.drop_rate > 0:
            out = F.dropout(out, p=self.drop_rate, training=self.training)

        return out


class DenseBlock(nn.Module):
    """Dense block containing multiple dense layers."""

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
    """Transition layer between dense blocks."""

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

### Complete DenseNet Implementation

```python
class DenseNet(nn.Module):
    """Complete DenseNet implementation."""

    def __init__(self, growth_rate=32, block_config=(6, 12, 24, 16),
                 num_init_features=64, bn_size=4, drop_rate=0.0,
                 num_classes=1000, compression=0.5):
        super().__init__()

        # Initial convolution
        self.features = nn.Sequential(
            nn.Conv2d(3, num_init_features, kernel_size=7, stride=2, padding=3, bias=False),
            nn.BatchNorm2d(num_init_features),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=3, stride=2, padding=1)
        )

        # Dense blocks and transitions
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

        # Final batch norm
        self.features.add_module('norm_final', nn.BatchNorm2d(num_features))

        # Classification head
        self.classifier = nn.Linear(num_features, num_classes)

        # Weight initialization
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


# Factory functions for DenseNet variants
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

### DenseNet Advantages

**Feature Reuse:**
- Each layer has access to all preceding feature maps
- Reduces redundant feature learning
- Enables more efficient parameter usage

**Gradient Flow:**
- Direct connections provide implicit deep supervision
- Gradients flow directly to early layers
- Mitigates vanishing gradient problem

**Parameter Efficiency:**
- Fewer parameters than traditional networks
- Growth rate controls model capacity
- Compression in transitions reduces feature map size

## EfficientNet: Compound Scaling

EfficientNet introduces a principled approach to scaling neural networks by balancing depth, width, and resolution.

### Compound Scaling Principle

Traditional approaches scale only one dimension (depth, width, or resolution). EfficientNet scales all three dimensions uniformly using a compound coefficient:

$$\text{depth}: d = \alpha^\phi$$
$$\text{width}: w = \beta^\phi$$
$$\text{resolution}: r = \gamma^\phi$$

Subject to: alpha * beta^2 * gamma^2 is approximately 2

This constraint ensures that for any new phi, the total FLOPs roughly double.

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
import math

class SwishActivation(nn.Module):
    """Swish activation function: x * sigmoid(x)."""

    def forward(self, x):
        return x * torch.sigmoid(x)


class SqueezeExcitation(nn.Module):
    """Squeeze-and-Excitation block."""

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
    """Mobile Inverted Bottleneck Convolution block."""

    def __init__(self, in_channels, out_channels, kernel_size,
                 stride, expand_ratio, se_ratio=0.25, drop_rate=0.0):
        super().__init__()

        self.stride = stride
        self.use_residual = (stride == 1 and in_channels == out_channels)
        self.drop_rate = drop_rate

        # Expansion phase
        hidden_dim = int(in_channels * expand_ratio)

        layers = []
        if expand_ratio != 1:
            layers.extend([
                nn.Conv2d(in_channels, hidden_dim, kernel_size=1, bias=False),
                nn.BatchNorm2d(hidden_dim),
                SwishActivation()
            ])

        # Depthwise convolution
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

        # Squeeze-and-Excitation
        se_channels = max(1, int(in_channels * se_ratio))
        self.se = SqueezeExcitation(hidden_dim, se_channels)

        # Projection phase
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
        """Drop connect implementation."""
        keep_prob = 1 - self.drop_rate
        batch_size = x.size(0)
        random_tensor = keep_prob + torch.rand(
            batch_size, 1, 1, 1, device=x.device
        )
        binary_mask = torch.floor(random_tensor)
        return x * binary_mask / keep_prob
```

### Complete EfficientNet Implementation

```python
class EfficientNet(nn.Module):
    """EfficientNet implementation."""

    # Base architecture configurations (EfficientNet-B0)
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

    # Scaling coefficients for different variants
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

        # Scale base channels
        def scale_channels(channels):
            return int(math.ceil(channels * width_mult / 8) * 8)

        # Scale number of layers
        def scale_depth(num_layers):
            return int(math.ceil(num_layers * depth_mult))

        # Stem
        out_channels = scale_channels(32)
        self.stem = nn.Sequential(
            nn.Conv2d(3, out_channels, kernel_size=3, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(out_channels),
            SwishActivation()
        )

        # Build blocks
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

        # Head
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


# Factory functions
def efficientnet_b0(num_classes=1000):
    return EfficientNet('b0', num_classes)

def efficientnet_b7(num_classes=1000):
    return EfficientNet('b7', num_classes)
```

## MobileNet: Lightweight Architectures

MobileNet is designed for mobile and embedded vision applications where computational resources are limited.

### Depthwise Separable Convolutions

The key innovation is factorizing standard convolutions into depthwise and pointwise convolutions:

**Standard convolution cost:** D_K * D_K * M * N * D_F * D_F

**Depthwise separable cost:** D_K * D_K * M * D_F * D_F + M * N * D_F * D_F

**Reduction ratio:** 1/N + 1/D_K^2

For a 3x3 kernel, this is approximately 8-9x fewer computations.

```python
import torch
import torch.nn as nn

class DepthwiseSeparableConv(nn.Module):
    """Depthwise separable convolution."""

    def __init__(self, in_channels, out_channels, stride=1):
        super().__init__()

        # Depthwise convolution
        self.depthwise = nn.Sequential(
            nn.Conv2d(
                in_channels, in_channels, kernel_size=3,
                stride=stride, padding=1, groups=in_channels, bias=False
            ),
            nn.BatchNorm2d(in_channels),
            nn.ReLU6(inplace=True)
        )

        # Pointwise convolution
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
    """MobileNet V1 implementation."""

    def __init__(self, num_classes=1000, width_mult=1.0):
        super().__init__()

        def scaled_channels(channels):
            return int(channels * width_mult)

        # Configuration: (out_channels, stride)
        config = [
            (64, 1), (128, 2), (128, 1), (256, 2), (256, 1),
            (512, 2), (512, 1), (512, 1), (512, 1), (512, 1), (512, 1),
            (1024, 2), (1024, 1)
        ]

        # Initial convolution
        self.conv1 = nn.Sequential(
            nn.Conv2d(3, scaled_channels(32), kernel_size=3, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(scaled_channels(32)),
            nn.ReLU6(inplace=True)
        )

        # Depthwise separable layers
        layers = []
        in_channels = scaled_channels(32)
        for out_channels, stride in config:
            out_channels = scaled_channels(out_channels)
            layers.append(DepthwiseSeparableConv(in_channels, out_channels, stride))
            in_channels = out_channels

        self.features = nn.Sequential(*layers)

        # Classification head
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

### MobileNet V2: Inverted Residuals

MobileNet V2 introduces inverted residual blocks with linear bottlenecks:

```python
class InvertedResidual(nn.Module):
    """Inverted residual block (MobileNet V2)."""

    def __init__(self, in_channels, out_channels, stride, expand_ratio):
        super().__init__()

        self.stride = stride
        self.use_residual = stride == 1 and in_channels == out_channels

        hidden_dim = int(in_channels * expand_ratio)

        layers = []

        # Expansion (if expand_ratio > 1)
        if expand_ratio != 1:
            layers.extend([
                nn.Conv2d(in_channels, hidden_dim, kernel_size=1, bias=False),
                nn.BatchNorm2d(hidden_dim),
                nn.ReLU6(inplace=True)
            ])

        # Depthwise convolution
        layers.extend([
            nn.Conv2d(
                hidden_dim, hidden_dim, kernel_size=3,
                stride=stride, padding=1, groups=hidden_dim, bias=False
            ),
            nn.BatchNorm2d(hidden_dim),
            nn.ReLU6(inplace=True)
        ])

        # Linear projection (no activation)
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
    """MobileNet V2 implementation."""

    def __init__(self, num_classes=1000, width_mult=1.0):
        super().__init__()

        # Configuration: (expand_ratio, out_channels, num_blocks, stride)
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

        # Initial convolution
        input_channels = scaled_channels(32)
        self.features = nn.Sequential(
            nn.Conv2d(3, input_channels, kernel_size=3, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(input_channels),
            nn.ReLU6(inplace=True)
        )

        # Inverted residual blocks
        for expand_ratio, out_channels, num_blocks, stride in inverted_residual_config:
            out_channels = scaled_channels(out_channels)
            for i in range(num_blocks):
                s = stride if i == 0 else 1
                self.features.add_module(
                    f'inverted_{len(self.features)}',
                    InvertedResidual(input_channels, out_channels, s, expand_ratio)
                )
                input_channels = out_channels

        # Final convolution
        last_channels = scaled_channels(1280)
        self.features.add_module('conv_last', nn.Sequential(
            nn.Conv2d(input_channels, last_channels, kernel_size=1, bias=False),
            nn.BatchNorm2d(last_channels),
            nn.ReLU6(inplace=True)
        ))

        # Classification head
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

MobileNet V3 incorporates Neural Architecture Search (NAS) with hardware-aware optimization:

```python
class HardSwish(nn.Module):
    """Hard Swish activation."""

    def forward(self, x):
        return x * F.relu6(x + 3) / 6


class HardSigmoid(nn.Module):
    """Hard Sigmoid activation."""

    def forward(self, x):
        return F.relu6(x + 3) / 6


class SEBlock(nn.Module):
    """Squeeze-and-Excitation block for MobileNetV3."""

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
    """MobileNet V3 block."""

    def __init__(self, in_channels, out_channels, kernel_size,
                 stride, expand_ratio, use_se, activation):
        super().__init__()

        self.stride = stride
        self.use_residual = stride == 1 and in_channels == out_channels

        hidden_dim = int(in_channels * expand_ratio)

        # Choose activation
        act = HardSwish() if activation == 'HS' else nn.ReLU(inplace=True)

        layers = []

        # Expansion
        if expand_ratio != 1:
            layers.extend([
                nn.Conv2d(in_channels, hidden_dim, kernel_size=1, bias=False),
                nn.BatchNorm2d(hidden_dim),
                act
            ])

        # Depthwise
        layers.extend([
            nn.Conv2d(
                hidden_dim, hidden_dim, kernel_size=kernel_size,
                stride=stride, padding=kernel_size // 2,
                groups=hidden_dim, bias=False
            ),
            nn.BatchNorm2d(hidden_dim),
            act
        ])

        # Squeeze-and-Excitation
        if use_se:
            layers.append(SEBlock(hidden_dim))

        # Projection
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

## Neural Architecture Search (NAS)

Neural Architecture Search automates the design of neural network architectures, often discovering designs that outperform human-designed networks.

### Search Space Definition

```python
import torch
import torch.nn as nn
import random

class NASSearchSpace:
    """Define the search space for NAS."""

    # Available operations
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
        """Sample a random architecture from the search space."""
        architecture = []

        for i in range(num_nodes):
            node_connections = []
            for j in range(i + 2):  # Can connect to input and all previous nodes
                op_name = random.choice(list(cls.OPERATIONS.keys()))
                node_connections.append((j, op_name))
            architecture.append(node_connections)

        return architecture


class SeparableConv(nn.Module):
    """Separable convolution for NAS."""

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
    """Zero operation (no connection)."""

    def __init__(self, channels):
        super().__init__()
        self.channels = channels

    def forward(self, x):
        return torch.zeros_like(x)
```

### Differentiable Architecture Search (DARTS)

DARTS relaxes the discrete architecture search problem into a continuous optimization:

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class MixedOp(nn.Module):
    """Mixed operation for DARTS."""

    def __init__(self, channels, operations):
        super().__init__()

        self.ops = nn.ModuleList()
        for op_name in operations:
            op = NASSearchSpace.OPERATIONS[op_name](channels)
            self.ops.append(op)

    def forward(self, x, weights):
        return sum(w * op(x) for w, op in zip(weights, self.ops))


class DARTSCell(nn.Module):
    """DARTS cell with mixed operations."""

    def __init__(self, channels, num_nodes=4):
        super().__init__()

        self.num_nodes = num_nodes
        self.operations = list(NASSearchSpace.OPERATIONS.keys())

        # Create mixed operations for each edge
        self.edges = nn.ModuleDict()
        for i in range(num_nodes):
            for j in range(i + 2):
                edge_key = f'{j}_to_{i+2}'
                self.edges[edge_key] = MixedOp(channels, self.operations)

        # Architecture parameters (to be optimized)
        self._arch_parameters = nn.ParameterList()
        for i in range(num_nodes):
            for j in range(i + 2):
                alpha = nn.Parameter(torch.randn(len(self.operations)))
                self._arch_parameters.append(alpha)

    def forward(self, s0, s1):
        states = [s0, s1]

        param_idx = 0
        for i in range(self.num_nodes):
            # Aggregate inputs from all previous states
            node_inputs = []
            for j in range(len(states)):
                edge_key = f'{j}_to_{i+2}'
                weights = F.softmax(self._arch_parameters[param_idx], dim=0)
                node_inputs.append(self.edges[edge_key](states[j], weights))
                param_idx += 1

            # Sum all inputs to this node
            states.append(sum(node_inputs))

        # Concatenate all intermediate nodes
        return torch.cat(states[2:], dim=1)

    def arch_parameters(self):
        return self._arch_parameters
```

### NAS Training Procedure

```python
import torch.optim as optim

class DARTSTrainer:
    """DARTS bi-level optimization trainer."""

    def __init__(self, model, train_loader, val_loader, device):
        self.model = model.to(device)
        self.train_loader = train_loader
        self.val_loader = val_loader
        self.device = device

        # Optimizer for model weights
        self.weight_optimizer = optim.SGD(
            model.model_parameters(),
            lr=0.025,
            momentum=0.9,
            weight_decay=3e-4
        )

        # Optimizer for architecture parameters
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
            # Get training batch
            try:
                train_data, train_target = next(train_iter)
            except StopIteration:
                train_iter = iter(self.train_loader)
                train_data, train_target = next(train_iter)

            # Get validation batch
            try:
                val_data, val_target = next(val_iter)
            except StopIteration:
                val_iter = iter(self.val_loader)
                val_data, val_target = next(val_iter)

            train_data = train_data.to(self.device)
            train_target = train_target.to(self.device)
            val_data = val_data.to(self.device)
            val_target = val_target.to(self.device)

            # Update architecture parameters on validation data
            self.arch_optimizer.zero_grad()
            val_output = self.model(val_data)
            val_loss = self.criterion(val_output, val_target)
            val_loss.backward()
            self.arch_optimizer.step()

            # Update model weights on training data
            self.weight_optimizer.zero_grad()
            train_output = self.model(train_data)
            train_loss = self.criterion(train_output, train_target)
            train_loss.backward()
            self.weight_optimizer.step()
```

## Vision Transformer (ViT)

Vision Transformer applies the Transformer architecture, originally designed for NLP, to image classification.

### Patch Embedding

Images are divided into fixed-size patches, which are then linearly projected to create token embeddings:

```python
import torch
import torch.nn as nn
import math

class PatchEmbedding(nn.Module):
    """Convert image to patch embeddings."""

    def __init__(self, img_size=224, patch_size=16, in_channels=3, embed_dim=768):
        super().__init__()

        self.img_size = img_size
        self.patch_size = patch_size
        self.num_patches = (img_size // patch_size) ** 2

        # Linear projection of flattened patches
        self.projection = nn.Conv2d(
            in_channels, embed_dim,
            kernel_size=patch_size, stride=patch_size
        )

    def forward(self, x):
        # x: (B, C, H, W) -> (B, embed_dim, H/P, W/P)
        x = self.projection(x)
        # Flatten and transpose: (B, embed_dim, N) -> (B, N, embed_dim)
        x = x.flatten(2).transpose(1, 2)
        return x


class PositionalEmbedding(nn.Module):
    """Learnable positional embeddings."""

    def __init__(self, num_patches, embed_dim):
        super().__init__()

        # +1 for [CLS] token
        self.pos_embedding = nn.Parameter(
            torch.randn(1, num_patches + 1, embed_dim) * 0.02
        )
        self.cls_token = nn.Parameter(torch.randn(1, 1, embed_dim) * 0.02)

    def forward(self, x):
        batch_size = x.size(0)

        # Expand [CLS] token to batch size
        cls_tokens = self.cls_token.expand(batch_size, -1, -1)

        # Prepend [CLS] token
        x = torch.cat([cls_tokens, x], dim=1)

        # Add positional embeddings
        x = x + self.pos_embedding
        return x
```

### Multi-Head Self-Attention

```python
class MultiHeadAttention(nn.Module):
    """Multi-head self-attention mechanism."""

    def __init__(self, embed_dim, num_heads, dropout=0.0):
        super().__init__()

        self.embed_dim = embed_dim
        self.num_heads = num_heads
        self.head_dim = embed_dim // num_heads
        self.scale = self.head_dim ** -0.5

        assert self.head_dim * num_heads == embed_dim, \
            "embed_dim must be divisible by num_heads"

        self.qkv = nn.Linear(embed_dim, embed_dim * 3)
        self.attn_dropout = nn.Dropout(dropout)
        self.proj = nn.Linear(embed_dim, embed_dim)
        self.proj_dropout = nn.Dropout(dropout)

    def forward(self, x):
        B, N, C = x.shape

        # Generate Q, K, V
        qkv = self.qkv(x).reshape(B, N, 3, self.num_heads, self.head_dim)
        qkv = qkv.permute(2, 0, 3, 1, 4)  # (3, B, num_heads, N, head_dim)
        q, k, v = qkv[0], qkv[1], qkv[2]

        # Scaled dot-product attention
        attn = (q @ k.transpose(-2, -1)) * self.scale
        attn = attn.softmax(dim=-1)
        attn = self.attn_dropout(attn)

        # Combine heads
        x = (attn @ v).transpose(1, 2).reshape(B, N, C)
        x = self.proj(x)
        x = self.proj_dropout(x)

        return x


class TransformerBlock(nn.Module):
    """Transformer encoder block."""

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
        # Pre-norm architecture
        x = x + self.attn(self.norm1(x))
        x = x + self.mlp(self.norm2(x))
        return x
```

### Complete Vision Transformer

```python
class VisionTransformer(nn.Module):
    """Vision Transformer (ViT) implementation."""

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

        # Patch embedding
        self.patch_embed = PatchEmbedding(
            img_size, patch_size, in_channels, embed_dim
        )
        num_patches = self.patch_embed.num_patches

        # Positional embedding and [CLS] token
        self.pos_embed = PositionalEmbedding(num_patches, embed_dim)
        self.pos_dropout = nn.Dropout(dropout)

        # Transformer encoder
        self.blocks = nn.Sequential(*[
            TransformerBlock(embed_dim, num_heads, mlp_ratio, dropout)
            for _ in range(depth)
        ])

        # Classification head
        self.norm = nn.LayerNorm(embed_dim)
        self.head = nn.Linear(embed_dim, num_classes)

        self._initialize_weights()

    def _initialize_weights(self):
        # Initialize patch embedding like a linear layer
        w = self.patch_embed.projection.weight.data
        nn.init.xavier_uniform_(w.view([w.shape[0], -1]))

        # Initialize classification head
        nn.init.zeros_(self.head.weight)
        nn.init.zeros_(self.head.bias)

    def forward(self, x):
        # Patch embedding
        x = self.patch_embed(x)

        # Add positional embedding and [CLS] token
        x = self.pos_embed(x)
        x = self.pos_dropout(x)

        # Transformer encoder
        x = self.blocks(x)

        # Classification using [CLS] token
        x = self.norm(x)
        cls_token = x[:, 0]
        x = self.head(cls_token)

        return x


# Factory functions for ViT variants
def vit_base_patch16(num_classes=1000):
    """ViT-Base with 16x16 patches."""
    return VisionTransformer(
        patch_size=16, embed_dim=768, depth=12,
        num_heads=12, num_classes=num_classes
    )

def vit_large_patch16(num_classes=1000):
    """ViT-Large with 16x16 patches."""
    return VisionTransformer(
        patch_size=16, embed_dim=1024, depth=24,
        num_heads=16, num_classes=num_classes
    )

def vit_huge_patch14(num_classes=1000):
    """ViT-Huge with 14x14 patches."""
    return VisionTransformer(
        img_size=224, patch_size=14, embed_dim=1280,
        depth=32, num_heads=16, num_classes=num_classes
    )
```

## Practical Implementation Guide

### Training Modern Architectures

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from torch.cuda.amp import GradScaler, autocast

class ModelTrainer:
    """Complete training pipeline for modern architectures."""

    def __init__(self, model, device='cuda'):
        self.model = model.to(device)
        self.device = device
        self.scaler = GradScaler()  # For mixed precision training

    def get_optimizer(self, lr=0.001, weight_decay=0.05):
        """AdamW optimizer with layer-wise learning rate decay."""

        # Separate parameters for weight decay
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
        """Cosine annealing with warmup."""

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

            # Mixed precision training
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

### Transfer Learning and Fine-tuning

```python
import torchvision.models as models

def load_pretrained_model(model_name, num_classes, freeze_backbone=True):
    """Load and modify pretrained models."""

    if model_name == 'resnet50':
        model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V2)

        # Freeze backbone
        if freeze_backbone:
            for param in model.parameters():
                param.requires_grad = False

        # Replace classifier
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

## Architecture Comparison

### Performance Comparison Table

| Architecture | Parameters | FLOPs | Top-1 Acc | Top-5 Acc | Key Innovation |
|--------------|------------|-------|-----------|-----------|----------------|
| VGG-16 | 138M | 15.5B | 71.5% | 90.1% | Deep networks |
| ResNet-50 | 25.6M | 4.1B | 76.1% | 92.9% | Skip connections |
| ResNet-152 | 60.2M | 11.5B | 78.3% | 94.2% | Deeper residuals |
| DenseNet-121 | 8.0M | 2.9B | 74.4% | 91.9% | Dense connections |
| DenseNet-264 | 33.3M | 5.8B | 77.8% | 93.9% | Deeper dense |
| MobileNet V2 | 3.4M | 0.3B | 72.0% | 90.3% | Inverted residuals |
| MobileNet V3 | 5.4M | 0.2B | 75.2% | 92.2% | NAS + SE |
| EfficientNet-B0 | 5.3M | 0.4B | 77.1% | 93.3% | Compound scaling |
| EfficientNet-B7 | 66M | 37B | 84.3% | 97.0% | Large compound |
| ViT-B/16 | 86M | 17.6B | 81.8% | 96.1% | Pure attention |
| ViT-L/16 | 307M | 63.6B | 85.2% | 97.2% | Large transformer |

### When to Use Which Architecture

```python
def recommend_architecture(constraints):
    """Recommend architecture based on deployment constraints."""

    recommendations = {
        'mobile': {
            'architecture': 'MobileNet V3',
            'reason': 'Optimized for mobile deployment with minimal latency',
            'variants': ['MobileNetV3-Small', 'MobileNetV3-Large']
        },
        'edge': {
            'architecture': 'EfficientNet-B0/B1',
            'reason': 'Best accuracy-efficiency trade-off for edge devices',
            'variants': ['EfficientNet-B0', 'EfficientNet-Lite']
        },
        'server': {
            'architecture': 'EfficientNet-B4+/ResNet-152',
            'reason': 'Maximum accuracy with server-grade hardware',
            'variants': ['EfficientNet-B7', 'ResNet-152', 'ViT-L']
        },
        'transfer_learning': {
            'architecture': 'ResNet-50/EfficientNet-B0',
            'reason': 'Well-studied, many pretrained variants available',
            'variants': ['ResNet-50', 'EfficientNet-B0', 'ViT-B/16']
        },
        'small_dataset': {
            'architecture': 'ResNet with heavy augmentation',
            'reason': 'CNNs have better inductive bias for limited data',
            'variants': ['ResNet-18', 'ResNet-34', 'EfficientNet-B0']
        },
        'large_dataset': {
            'architecture': 'Vision Transformer',
            'reason': 'Transformers excel with abundant training data',
            'variants': ['ViT-B/16', 'ViT-L/16', 'DeiT']
        }
    }

    return recommendations.get(constraints, recommendations['server'])
```

## Interview Key Points

### Common Interview Questions

**Q1: Explain the vanishing gradient problem and how ResNet solves it.**

The vanishing gradient problem occurs when gradients become exponentially small as they propagate through deep networks during backpropagation. This happens because gradients are multiplied by weights and activation function derivatives at each layer. With sigmoid/tanh activations, derivatives are always less than 1, causing gradients to vanish.

ResNet solves this by introducing skip connections (residual connections). Instead of learning H(x), the network learns F(x) = H(x) - x, and the output is F(x) + x. During backpropagation, the gradient can flow directly through the skip connection, providing a "gradient highway" that bypasses the nonlinearities. This enables training of networks with hundreds of layers.

**Q2: Compare DenseNet and ResNet. When would you prefer one over the other?**

| Aspect | ResNet | DenseNet |
|--------|--------|----------|
| Connections | Identity shortcuts | All-to-all within blocks |
| Feature reuse | Implicit | Explicit concatenation |
| Parameters | More | Fewer (with same depth) |
| Memory | Lower | Higher (stores all features) |
| Gradient flow | Through shortcuts | Direct to all layers |

Choose ResNet when: Memory is constrained, need faster inference, or using very deep networks (>200 layers).

Choose DenseNet when: Parameter efficiency matters, working with smaller datasets (better feature reuse helps generalization), or computational resources allow for the memory overhead.

**Q3: How does compound scaling in EfficientNet work?**

EfficientNet scales networks uniformly across three dimensions:
- Depth (number of layers): d = alpha^phi
- Width (channels per layer): w = beta^phi
- Resolution (input image size): r = gamma^phi

The constraint alpha * beta^2 * gamma^2 is approximately 2 ensures FLOPs roughly double for each unit increase in phi. For EfficientNet: alpha = 1.2, beta = 1.1, gamma = 1.15.

This approach is superior to scaling only one dimension because:
1. Higher resolution requires more layers to capture patterns at different scales
2. More layers require more channels to propagate features effectively
3. Balanced scaling achieves better accuracy per FLOP

**Q4: Explain the key differences between CNNs and Vision Transformers.**

| Aspect | CNNs | Vision Transformers |
|--------|------|---------------------|
| Inductive bias | Local connectivity, translation equivariance | Minimal (learned from data) |
| Receptive field | Grows with depth | Global from first layer |
| Data efficiency | Better with small datasets | Requires large datasets |
| Compute scaling | Efficient on images | Quadratic with sequence length |
| Position encoding | Implicit (through convolution) | Explicit (learned or fixed) |

Vision Transformers lack the strong inductive biases of CNNs (locality, translation invariance). This means:
- They need more data to learn spatial relationships from scratch
- But they can learn more flexible patterns when data is abundant
- They capture global context from the first layer, beneficial for some tasks

**Q5: What is Neural Architecture Search and how does DARTS work?**

Neural Architecture Search (NAS) automates the design of neural network architectures. DARTS (Differentiable Architecture Search) makes NAS efficient by:

1. **Continuous Relaxation**: Instead of discrete architecture choices, DARTS uses a weighted sum of all possible operations at each edge, with learnable weights (architecture parameters).

2. **Bi-level Optimization**:
   - Inner loop: Optimize network weights on training data
   - Outer loop: Optimize architecture parameters on validation data

3. **Deriving Final Architecture**: After training, select operations with highest architecture weights for each edge.

DARTS reduces search time from thousands of GPU-days to a few GPU-days by avoiding discrete search and using gradient descent instead.

### Practical Tips Summary

1. **Start Simple**: Begin with established architectures (ResNet-50, EfficientNet-B0) before trying custom designs.

2. **Consider Deployment**: Choose architecture based on target platform (mobile, edge, server).

3. **Use Pretrained Models**: Transfer learning from ImageNet-pretrained models significantly improves performance and training speed.

4. **Match Architecture to Data**: Use CNNs for small datasets; consider ViT for large datasets.

5. **Profile Before Optimizing**: Measure actual latency, not just FLOPs, as different operations have different hardware efficiency.

6. **Regularization Matters**: Modern architectures benefit from strong augmentation (RandAugment, MixUp) and regularization (DropPath, Label Smoothing).

7. **Learning Rate Scheduling**: Use warmup followed by cosine annealing for stable training of deep networks.

8. **Mixed Precision**: Enable FP16 training for faster training and lower memory usage on modern GPUs.

## Summary

Neural network architecture design has evolved significantly over the past decade, driven by the need to train deeper networks, boost productivity, and achieve better performance. Key takeaways from this guide:

1. **Residual Connections (ResNet)**: Skip connections enable training of very deep networks by providing gradient highways and making identity mappings easy to learn.

2. **Dense Connections (DenseNet)**: Connecting each layer to all subsequent layers promotes feature reuse and improves parameter efficiency.

3. **Compound Scaling (EfficientNet)**: Balanced scaling of depth, width, and resolution achieves better accuracy-efficiency trade-offs than single-dimension scaling.

4. **Lightweight Architectures (MobileNet)**: Depthwise separable convolutions and inverted residuals enable deployment on resource-constrained devices.

5. **Neural Architecture Search**: Automating architecture design can discover networks that outperform human-designed ones, with DARTS making search computationally tractable.

6. **Vision Transformers**: Applying self-attention to images achieves state-of-the-art results when sufficient training data is available.

The choice of architecture should be guided by:
- Available computational resources (training and inference)
- Dataset size and characteristics
- Deployment constraints (latency, memory, power)
- Task requirements (accuracy, interpretability)

Understanding these architectural innovations and their trade-offs is essential for any deep learning practitioner. As the field continues to evolve, new architectures will emerge, but the fundamental principles of efficient gradient flow, feature reuse, and balanced scaling will remain relevant.
