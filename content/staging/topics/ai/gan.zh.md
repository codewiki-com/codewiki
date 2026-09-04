---
title: 生成对抗网络 (GAN)
description: 深入理解GAN的原理和应用
track: ai
section: deep-learning
difficulty: advanced
tags:
  - GAN
  - 生成模型
  - 深度学习
  - 图像生成
status: imported
origin: old/src/content/docs/ai/gan.zh.md
divergence: 0.148
issues: []
legacy:
  category: AI
  subcategory: Deep Learning
  order: 16
  lastUpdated: 2026-01-07
---

生成对抗网络（Generative Adversarial Networks，GAN）是由Ian Goodfellow于2014年提出的一种革命性的生成模型框架。GAN通过两个神经网络的对抗博弈，能够学习数据的分布并生成逼真的新样本，在图像生成、风格迁移、数据增强等领域取得了巨大成功。

---

## GAN基本原理

### 对抗博弈思想

GAN的核心思想来源于博弈论中的二人零和博弈。系统包含两个神经网络：

- **生成器（Generator，G）**：学习将随机噪声映射到数据空间，生成"假"样本
- **判别器（Discriminator，D）**：学习区分真实样本和生成样本

这两个网络相互对抗：生成器试图生成越来越逼真的假样本来欺骗判别器，而判别器则努力准确区分真假样本。

```
┌─────────────────────────────────────────────────────────────┐
│                      GAN 架构示意图                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   随机噪声 z ──→ [生成器 G] ──→ 生成图像 G(z)               │
│                                    ↓                        │
│                              ┌─────────────┐                │
│   真实图像 x ───────────────→│  判别器 D   │──→ 真/假概率    │
│                              └─────────────┘                │
│                                                             │
│   训练目标：                                                │
│   • 生成器：最大化 D(G(z))，让判别器误判                    │
│   • 判别器：最大化区分真假的能力                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 数学公式

GAN的目标函数是一个极小极大博弈（minimax game）：

$$\min_G \max_D V(D, G) = \mathbb{E}_{x \sim p_{data}(x)}[\log D(x)] + \mathbb{E}_{z \sim p_z(z)}[\log(1 - D(G(z)))]$$

其中：
- $p_{data}(x)$ 是真实数据分布
- $p_z(z)$ 是噪声先验分布（通常是高斯分布或均匀分布）
- $D(x)$ 表示判别器认为 $x$ 是真实样本的概率
- $G(z)$ 是生成器根据噪声 $z$ 生成的样本

**理论最优解：**

当生成器达到最优时，$p_g = p_{data}$，即生成数据分布等于真实数据分布。此时判别器的最优策略是：

$$D^*(x) = \frac{p_{data}(x)}{p_{data}(x) + p_g(x)} = \frac{1}{2}$$

```python
import torch
import torch.nn as nn

def gan_loss_vanilla(d_real, d_fake, real_label=1.0, fake_label=0.0):
    """
    原始GAN损失函数

    Args:
        d_real: 判别器对真实样本的输出
        d_fake: 判别器对生成样本的输出
    """
    criterion = nn.BCEWithLogitsLoss()

    # 判别器损失
    real_labels = torch.full_like(d_real, real_label)
    fake_labels = torch.full_like(d_fake, fake_label)

    d_loss_real = criterion(d_real, real_labels)
    d_loss_fake = criterion(d_fake, fake_labels)
    d_loss = d_loss_real + d_loss_fake

    # 生成器损失（希望判别器将假样本判为真）
    g_loss = criterion(d_fake, real_labels)

    return d_loss, g_loss
```

---

## 生成器与判别器

### 生成器架构

生成器负责将低维噪声向量映射到高维数据空间。对于图像生成任务，通常使用反卷积（转置卷积）逐步上采样。

```python
import torch.nn as nn

class Generator(nn.Module):
    """
    基础生成器网络
    将潜在向量z映射到图像空间
    """
    def __init__(self, latent_dim=100, img_channels=3, feature_maps=64):
        super().__init__()

        self.latent_dim = latent_dim

        self.main = nn.Sequential(
            # 输入: latent_dim x 1 x 1
            # 输出: (feature_maps*8) x 4 x 4
            nn.ConvTranspose2d(latent_dim, feature_maps * 8, 4, 1, 0, bias=False),
            nn.BatchNorm2d(feature_maps * 8),
            nn.ReLU(True),

            # 输出: (feature_maps*4) x 8 x 8
            nn.ConvTranspose2d(feature_maps * 8, feature_maps * 4, 4, 2, 1, bias=False),
            nn.BatchNorm2d(feature_maps * 4),
            nn.ReLU(True),

            # 输出: (feature_maps*2) x 16 x 16
            nn.ConvTranspose2d(feature_maps * 4, feature_maps * 2, 4, 2, 1, bias=False),
            nn.BatchNorm2d(feature_maps * 2),
            nn.ReLU(True),

            # 输出: feature_maps x 32 x 32
            nn.ConvTranspose2d(feature_maps * 2, feature_maps, 4, 2, 1, bias=False),
            nn.BatchNorm2d(feature_maps),
            nn.ReLU(True),

            # 输出: img_channels x 64 x 64
            nn.ConvTranspose2d(feature_maps, img_channels, 4, 2, 1, bias=False),
            nn.Tanh()  # 输出范围[-1, 1]
        )

        # 权重初始化
        self.apply(self._init_weights)

    def _init_weights(self, m):
        if isinstance(m, (nn.ConvTranspose2d, nn.Conv2d)):
            nn.init.normal_(m.weight, 0.0, 0.02)
        elif isinstance(m, nn.BatchNorm2d):
            nn.init.normal_(m.weight, 1.0, 0.02)
            nn.init.constant_(m.bias, 0)

    def forward(self, z):
        # z shape: (batch_size, latent_dim)
        # 重塑为 (batch_size, latent_dim, 1, 1)
        z = z.view(-1, self.latent_dim, 1, 1)
        return self.main(z)
```

### 判别器架构

判别器是一个二分类器，判断输入样本是真实的还是生成的。通常使用卷积神经网络逐步下采样。

```python
class Discriminator(nn.Module):
    """
    判别器网络
    区分真实图像和生成图像
    """
    def __init__(self, img_channels=3, feature_maps=64):
        super().__init__()

        self.main = nn.Sequential(
            # 输入: img_channels x 64 x 64
            # 输出: feature_maps x 32 x 32
            nn.Conv2d(img_channels, feature_maps, 4, 2, 1, bias=False),
            nn.LeakyReLU(0.2, inplace=True),

            # 输出: (feature_maps*2) x 16 x 16
            nn.Conv2d(feature_maps, feature_maps * 2, 4, 2, 1, bias=False),
            nn.BatchNorm2d(feature_maps * 2),
            nn.LeakyReLU(0.2, inplace=True),

            # 输出: (feature_maps*4) x 8 x 8
            nn.Conv2d(feature_maps * 2, feature_maps * 4, 4, 2, 1, bias=False),
            nn.BatchNorm2d(feature_maps * 4),
            nn.LeakyReLU(0.2, inplace=True),

            # 输出: (feature_maps*8) x 4 x 4
            nn.Conv2d(feature_maps * 4, feature_maps * 8, 4, 2, 1, bias=False),
            nn.BatchNorm2d(feature_maps * 8),
            nn.LeakyReLU(0.2, inplace=True),

            # 输出: 1 x 1 x 1
            nn.Conv2d(feature_maps * 8, 1, 4, 1, 0, bias=False),
            # 注意：使用BCEWithLogitsLoss时不需要Sigmoid
        )

        self.apply(self._init_weights)

    def _init_weights(self, m):
        if isinstance(m, nn.Conv2d):
            nn.init.normal_(m.weight, 0.0, 0.02)
        elif isinstance(m, nn.BatchNorm2d):
            nn.init.normal_(m.weight, 1.0, 0.02)
            nn.init.constant_(m.bias, 0)

    def forward(self, x):
        return self.main(x).view(-1, 1).squeeze(1)
```

### 架构设计原则

| 组件 | 生成器 | 判别器 |
|------|--------|--------|
| 归一化 | BatchNorm（除输出层外） | BatchNorm（除输入层外） |
| 激活函数 | ReLU | LeakyReLU |
| 输出激活 | Tanh | 无（配合BCEWithLogitsLoss） |
| 池化 | 不使用 | 不使用 |
| 下/上采样 | 转置卷积（步长2） | 卷积（步长2） |

---

## 训练动态与优化

### 训练过程

GAN的训练是一个交替优化的过程：

```python
import torch
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms

class GANTrainer:
    """GAN训练器"""

    def __init__(self, generator, discriminator, device='cuda'):
        self.G = generator.to(device)
        self.D = discriminator.to(device)
        self.device = device

        # 优化器
        self.g_optimizer = optim.Adam(
            self.G.parameters(),
            lr=0.0002,
            betas=(0.5, 0.999)
        )
        self.d_optimizer = optim.Adam(
            self.D.parameters(),
            lr=0.0002,
            betas=(0.5, 0.999)
        )

        self.criterion = nn.BCEWithLogitsLoss()
        self.latent_dim = generator.latent_dim

    def train_discriminator(self, real_images, batch_size):
        """训练判别器一步"""
        self.D.zero_grad()

        # 真实图像标签
        real_labels = torch.ones(batch_size, device=self.device)
        fake_labels = torch.zeros(batch_size, device=self.device)

        # 判别真实图像
        d_real = self.D(real_images)
        d_real_loss = self.criterion(d_real, real_labels)

        # 生成假图像
        z = torch.randn(batch_size, self.latent_dim, device=self.device)
        fake_images = self.G(z).detach()  # 不计算生成器梯度

        # 判别假图像
        d_fake = self.D(fake_images)
        d_fake_loss = self.criterion(d_fake, fake_labels)

        # 总损失
        d_loss = d_real_loss + d_fake_loss
        d_loss.backward()
        self.d_optimizer.step()

        return d_loss.item(), d_real.mean().item(), d_fake.mean().item()

    def train_generator(self, batch_size):
        """训练生成器一步"""
        self.G.zero_grad()

        # 生成假图像
        z = torch.randn(batch_size, self.latent_dim, device=self.device)
        fake_images = self.G(z)

        # 希望判别器将假图像判为真
        real_labels = torch.ones(batch_size, device=self.device)
        d_fake = self.D(fake_images)
        g_loss = self.criterion(d_fake, real_labels)

        g_loss.backward()
        self.g_optimizer.step()

        return g_loss.item()

    def train_epoch(self, dataloader):
        """训练一个epoch"""
        self.G.train()
        self.D.train()

        total_d_loss = 0
        total_g_loss = 0
        num_batches = 0

        for real_images, _ in dataloader:
            batch_size = real_images.size(0)
            real_images = real_images.to(self.device)

            # 训练判别器
            d_loss, d_real, d_fake = self.train_discriminator(real_images, batch_size)

            # 训练生成器
            g_loss = self.train_generator(batch_size)

            total_d_loss += d_loss
            total_g_loss += g_loss
            num_batches += 1

        return total_d_loss / num_batches, total_g_loss / num_batches
```

### 训练稳定性问题

GAN训练中常见的问题：

1. **梯度消失**：当判别器过强时，$\log(1-D(G(z)))$ 趋近于0，生成器梯度消失
2. **训练震荡**：G和D的性能波动，难以收敛
3. **模式崩溃**：生成器只产生有限类型的样本

```python
def non_saturating_loss(d_fake, real_label=1.0):
    """
    非饱和损失（Non-saturating loss）
    解决原始GAN的梯度消失问题

    原始: min -log(1 - D(G(z)))  -> 梯度饱和
    改进: max log(D(G(z)))       -> 更强梯度信号
    """
    criterion = nn.BCEWithLogitsLoss()
    real_labels = torch.full_like(d_fake, real_label)
    return criterion(d_fake, real_labels)


def wasserstein_loss(d_real, d_fake):
    """
    Wasserstein损失（WGAN）
    使用Wasserstein距离代替JS散度

    判别器损失: max E[D(x)] - E[D(G(z))]
    生成器损失: max E[D(G(z))]
    """
    d_loss = -(d_real.mean() - d_fake.mean())
    g_loss = -d_fake.mean()
    return d_loss, g_loss
```

### 学习率与优化器选择

```python
# 推荐的训练超参数
training_config = {
    'learning_rate': 0.0002,
    'beta1': 0.5,          # Adam的动量参数，GAN中通常设为0.5
    'beta2': 0.999,
    'batch_size': 64,
    'latent_dim': 100,
    'n_critic': 1,         # 每训练G一次，训练D的次数
}

# 学习率调度（可选）
def get_schedulers(g_optimizer, d_optimizer, num_epochs):
    """获取学习率调度器"""
    g_scheduler = optim.lr_scheduler.LambdaLR(
        g_optimizer,
        lr_lambda=lambda epoch: 1 - epoch / num_epochs
    )
    d_scheduler = optim.lr_scheduler.LambdaLR(
        d_optimizer,
        lr_lambda=lambda epoch: 1 - epoch / num_epochs
    )
    return g_scheduler, d_scheduler
```

---

## 模式崩溃问题

### 什么是模式崩溃

模式崩溃（Mode Collapse）是GAN训练中最常见的问题之一。生成器不是学习真实数据的完整分布，而是只学习生成少数几种类型的样本。

```
┌─────────────────────────────────────────────────────────────┐
│                    模式崩溃示意图                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   真实数据分布（多模态）:                                    │
│                                                             │
│     ∧     ∧     ∧     ∧     ∧                              │
│    /|\   /|\   /|\   /|\   /|\                             │
│   / | \ / | \ / | \ / | \ / | \                            │
│  ───────────────────────────────                            │
│  模式1  模式2  模式3  模式4  模式5                           │
│                                                             │
│   模式崩溃后的生成分布:                                      │
│                                                             │
│           ∧                                                 │
│          /|\                                                │
│         / | \                                               │
│  ───────────────────────────────                            │
│       只生成模式3                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 解决方案

#### Mini-batch Discrimination

让判别器可以看到整个批次的统计信息：

```python
class MinibatchDiscrimination(nn.Module):
    """
    Mini-batch判别层
    允许判别器检测生成样本的多样性
    """
    def __init__(self, in_features, out_features, kernel_dims=5):
        super().__init__()
        self.T = nn.Parameter(
            torch.randn(in_features, out_features, kernel_dims)
        )

    def forward(self, x):
        # x shape: (batch_size, in_features)
        # 计算batch内样本间的相似度
        matrices = torch.matmul(x, self.T.view(x.size(1), -1))
        matrices = matrices.view(-1, self.T.size(1), self.T.size(2))

        # L1距离
        M = matrices.unsqueeze(0)  # (1, batch, out, kernel)
        M_T = M.permute(1, 0, 2, 3)  # (batch, 1, out, kernel)

        # 计算所有样本对之间的距离
        norm = torch.abs(M - M_T).sum(3)  # (batch, batch, out)

        # 排除自身
        expnorm = torch.exp(-norm)
        mask = 1 - torch.eye(x.size(0), device=x.device)
        o_b = (expnorm * mask.unsqueeze(2)).sum(1)  # (batch, out)

        return torch.cat([x, o_b], dim=1)
```

#### Feature Matching

让生成器匹配判别器中间层的特征统计：

```python
class FeatureMatchingLoss(nn.Module):
    """
    特征匹配损失
    最小化真实样本和生成样本在判别器中间层特征的差异
    """
    def __init__(self, discriminator):
        super().__init__()
        self.discriminator = discriminator
        self.feature_layers = []

        # 注册hook获取中间层特征
        self._register_hooks()

    def _register_hooks(self):
        def hook(module, input, output):
            self.feature_layers.append(output)

        # 假设判别器有多个卷积层
        for name, module in self.discriminator.named_modules():
            if isinstance(module, nn.Conv2d):
                module.register_forward_hook(hook)

    def forward(self, real_images, fake_images):
        self.feature_layers = []
        _ = self.discriminator(real_images)
        real_features = self.feature_layers.copy()

        self.feature_layers = []
        _ = self.discriminator(fake_images)
        fake_features = self.feature_layers.copy()

        loss = 0
        for rf, ff in zip(real_features, fake_features):
            loss += torch.mean((rf.mean(0) - ff.mean(0)) ** 2)

        return loss
```

#### 历史平均惩罚

```python
class HistoricalAveraging:
    """
    历史平均惩罚
    防止参数变化过快导致的模式崩溃
    """
    def __init__(self, model, decay=0.999):
        self.model = model
        self.decay = decay
        self.historical_params = {}

        for name, param in model.named_parameters():
            self.historical_params[name] = param.data.clone()

    def penalty(self):
        """计算当前参数与历史平均的偏差"""
        loss = 0
        for name, param in self.model.named_parameters():
            loss += torch.mean((param - self.historical_params[name]) ** 2)
        return loss

    def update(self):
        """更新历史平均"""
        for name, param in self.model.named_parameters():
            self.historical_params[name] = (
                self.decay * self.historical_params[name] +
                (1 - self.decay) * param.data
            )
```

---

## GAN变体

### DCGAN (Deep Convolutional GAN)

DCGAN是第一个成功稳定训练的卷积GAN架构，提出了一系列架构设计准则：

```python
class DCGANGenerator(nn.Module):
    """
    DCGAN生成器
    遵循DCGAN架构准则
    """
    def __init__(self, latent_dim=100, ngf=64, nc=3):
        super().__init__()

        self.main = nn.Sequential(
            # 第1层: latent_dim -> ngf*8, 4x4
            nn.ConvTranspose2d(latent_dim, ngf * 8, 4, 1, 0, bias=False),
            nn.BatchNorm2d(ngf * 8),
            nn.ReLU(True),

            # 第2层: ngf*8 -> ngf*4, 8x8
            nn.ConvTranspose2d(ngf * 8, ngf * 4, 4, 2, 1, bias=False),
            nn.BatchNorm2d(ngf * 4),
            nn.ReLU(True),

            # 第3层: ngf*4 -> ngf*2, 16x16
            nn.ConvTranspose2d(ngf * 4, ngf * 2, 4, 2, 1, bias=False),
            nn.BatchNorm2d(ngf * 2),
            nn.ReLU(True),

            # 第4层: ngf*2 -> ngf, 32x32
            nn.ConvTranspose2d(ngf * 2, ngf, 4, 2, 1, bias=False),
            nn.BatchNorm2d(ngf),
            nn.ReLU(True),

            # 输出层: ngf -> nc, 64x64
            nn.ConvTranspose2d(ngf, nc, 4, 2, 1, bias=False),
            nn.Tanh()
        )

        # 权重初始化
        self.apply(weights_init)

    def forward(self, input):
        return self.main(input)


class DCGANDiscriminator(nn.Module):
    """
    DCGAN判别器
    """
    def __init__(self, nc=3, ndf=64):
        super().__init__()

        self.main = nn.Sequential(
            # 第1层: nc -> ndf, 32x32
            nn.Conv2d(nc, ndf, 4, 2, 1, bias=False),
            nn.LeakyReLU(0.2, inplace=True),

            # 第2层: ndf -> ndf*2, 16x16
            nn.Conv2d(ndf, ndf * 2, 4, 2, 1, bias=False),
            nn.BatchNorm2d(ndf * 2),
            nn.LeakyReLU(0.2, inplace=True),

            # 第3层: ndf*2 -> ndf*4, 8x8
            nn.Conv2d(ndf * 2, ndf * 4, 4, 2, 1, bias=False),
            nn.BatchNorm2d(ndf * 4),
            nn.LeakyReLU(0.2, inplace=True),

            # 第4层: ndf*4 -> ndf*8, 4x4
            nn.Conv2d(ndf * 4, ndf * 8, 4, 2, 1, bias=False),
            nn.BatchNorm2d(ndf * 8),
            nn.LeakyReLU(0.2, inplace=True),

            # 输出层: ndf*8 -> 1, 1x1
            nn.Conv2d(ndf * 8, 1, 4, 1, 0, bias=False),
        )

        self.apply(weights_init)

    def forward(self, input):
        return self.main(input).view(-1)


def weights_init(m):
    """DCGAN权重初始化"""
    classname = m.__class__.__name__
    if classname.find('Conv') != -1:
        nn.init.normal_(m.weight.data, 0.0, 0.02)
    elif classname.find('BatchNorm') != -1:
        nn.init.normal_(m.weight.data, 1.0, 0.02)
        nn.init.constant_(m.bias.data, 0)
```

### StyleGAN

StyleGAN引入了风格迁移的思想，通过映射网络和自适应实例归一化实现高质量图像生成：

```python
class MappingNetwork(nn.Module):
    """
    StyleGAN映射网络
    将潜在空间z映射到中间潜在空间w
    """
    def __init__(self, latent_dim=512, w_dim=512, num_layers=8):
        super().__init__()

        layers = []
        for i in range(num_layers):
            layers.append(nn.Linear(latent_dim if i == 0 else w_dim, w_dim))
            layers.append(nn.LeakyReLU(0.2))

        self.mapping = nn.Sequential(*layers)

    def forward(self, z):
        return self.mapping(z)


class AdaIN(nn.Module):
    """
    自适应实例归一化（Adaptive Instance Normalization）
    """
    def __init__(self, channels, w_dim):
        super().__init__()
        self.instance_norm = nn.InstanceNorm2d(channels)
        self.style_scale = nn.Linear(w_dim, channels)
        self.style_bias = nn.Linear(w_dim, channels)

    def forward(self, x, w):
        # 实例归一化
        x = self.instance_norm(x)

        # 从w获取风格参数
        style_scale = self.style_scale(w).unsqueeze(2).unsqueeze(3)
        style_bias = self.style_bias(w).unsqueeze(2).unsqueeze(3)

        # 应用风格调制
        return style_scale * x + style_bias


class StyleBlock(nn.Module):
    """
    StyleGAN风格块
    """
    def __init__(self, in_channels, out_channels, w_dim, upsample=True):
        super().__init__()

        self.upsample = nn.Upsample(scale_factor=2, mode='bilinear', align_corners=False) if upsample else None
        self.conv = nn.Conv2d(in_channels, out_channels, 3, 1, 1)
        self.adain = AdaIN(out_channels, w_dim)
        self.activation = nn.LeakyReLU(0.2)

        # 噪声注入
        self.noise_scale = nn.Parameter(torch.zeros(1, out_channels, 1, 1))

    def forward(self, x, w, noise=None):
        if self.upsample:
            x = self.upsample(x)

        x = self.conv(x)

        # 添加噪声
        if noise is None:
            noise = torch.randn(x.size(0), 1, x.size(2), x.size(3), device=x.device)
        x = x + self.noise_scale * noise

        x = self.adain(x, w)
        x = self.activation(x)

        return x


class StyleGANGenerator(nn.Module):
    """
    简化版StyleGAN生成器
    """
    def __init__(self, latent_dim=512, w_dim=512, img_resolution=256):
        super().__init__()

        self.mapping = MappingNetwork(latent_dim, w_dim)

        # 学习的常量输入
        self.const = nn.Parameter(torch.randn(1, 512, 4, 4))

        # 风格块
        self.blocks = nn.ModuleList([
            StyleBlock(512, 512, w_dim, upsample=True),   # 4 -> 8
            StyleBlock(512, 512, w_dim, upsample=True),   # 8 -> 16
            StyleBlock(512, 256, w_dim, upsample=True),   # 16 -> 32
            StyleBlock(256, 128, w_dim, upsample=True),   # 32 -> 64
            StyleBlock(128, 64, w_dim, upsample=True),    # 64 -> 128
            StyleBlock(64, 32, w_dim, upsample=True),     # 128 -> 256
        ])

        self.to_rgb = nn.Conv2d(32, 3, 1)

    def forward(self, z):
        w = self.mapping(z)

        x = self.const.expand(z.size(0), -1, -1, -1)

        for block in self.blocks:
            x = block(x, w)

        x = self.to_rgb(x)
        return torch.tanh(x)
```

### CycleGAN

CycleGAN实现无配对数据的图像转换，通过循环一致性损失保证转换的合理性：

```python
class ResidualBlock(nn.Module):
    """残差块"""
    def __init__(self, channels):
        super().__init__()
        self.block = nn.Sequential(
            nn.ReflectionPad2d(1),
            nn.Conv2d(channels, channels, 3),
            nn.InstanceNorm2d(channels),
            nn.ReLU(inplace=True),
            nn.ReflectionPad2d(1),
            nn.Conv2d(channels, channels, 3),
            nn.InstanceNorm2d(channels),
        )

    def forward(self, x):
        return x + self.block(x)


class CycleGANGenerator(nn.Module):
    """
    CycleGAN生成器
    使用残差网络架构
    """
    def __init__(self, input_nc=3, output_nc=3, ngf=64, n_residual=9):
        super().__init__()

        # 编码器
        self.encoder = nn.Sequential(
            nn.ReflectionPad2d(3),
            nn.Conv2d(input_nc, ngf, 7),
            nn.InstanceNorm2d(ngf),
            nn.ReLU(inplace=True),

            nn.Conv2d(ngf, ngf * 2, 3, 2, 1),
            nn.InstanceNorm2d(ngf * 2),
            nn.ReLU(inplace=True),

            nn.Conv2d(ngf * 2, ngf * 4, 3, 2, 1),
            nn.InstanceNorm2d(ngf * 4),
            nn.ReLU(inplace=True),
        )

        # 残差块
        self.transformer = nn.Sequential(
            *[ResidualBlock(ngf * 4) for _ in range(n_residual)]
        )

        # 解码器
        self.decoder = nn.Sequential(
            nn.ConvTranspose2d(ngf * 4, ngf * 2, 3, 2, 1, 1),
            nn.InstanceNorm2d(ngf * 2),
            nn.ReLU(inplace=True),

            nn.ConvTranspose2d(ngf * 2, ngf, 3, 2, 1, 1),
            nn.InstanceNorm2d(ngf),
            nn.ReLU(inplace=True),

            nn.ReflectionPad2d(3),
            nn.Conv2d(ngf, output_nc, 7),
            nn.Tanh(),
        )

    def forward(self, x):
        x = self.encoder(x)
        x = self.transformer(x)
        x = self.decoder(x)
        return x


class CycleGANLoss:
    """
    CycleGAN损失函数
    包含对抗损失、循环一致性损失和身份损失
    """
    def __init__(self, lambda_cycle=10.0, lambda_identity=0.5):
        self.lambda_cycle = lambda_cycle
        self.lambda_identity = lambda_identity
        self.criterion_gan = nn.MSELoss()  # LSGAN损失
        self.criterion_cycle = nn.L1Loss()
        self.criterion_identity = nn.L1Loss()

    def generator_loss(self, G_AB, G_BA, D_A, D_B, real_A, real_B):
        """
        生成器损失
        G_AB: A域到B域的生成器
        G_BA: B域到A域的生成器
        """
        # 生成假图像
        fake_B = G_AB(real_A)
        fake_A = G_BA(real_B)

        # 对抗损失
        pred_fake_B = D_B(fake_B)
        pred_fake_A = D_A(fake_A)
        loss_GAN_AB = self.criterion_gan(pred_fake_B, torch.ones_like(pred_fake_B))
        loss_GAN_BA = self.criterion_gan(pred_fake_A, torch.ones_like(pred_fake_A))
        loss_GAN = loss_GAN_AB + loss_GAN_BA

        # 循环一致性损失
        recovered_A = G_BA(fake_B)
        recovered_B = G_AB(fake_A)
        loss_cycle_A = self.criterion_cycle(recovered_A, real_A)
        loss_cycle_B = self.criterion_cycle(recovered_B, real_B)
        loss_cycle = (loss_cycle_A + loss_cycle_B) * self.lambda_cycle

        # 身份损失（可选）
        identity_A = G_BA(real_A)
        identity_B = G_AB(real_B)
        loss_identity_A = self.criterion_identity(identity_A, real_A)
        loss_identity_B = self.criterion_identity(identity_B, real_B)
        loss_identity = (loss_identity_A + loss_identity_B) * self.lambda_identity

        return loss_GAN + loss_cycle + loss_identity
```

### 其他重要变体

| 变体 | 核心思想 | 主要改进 |
|------|----------|----------|
| **WGAN** | Wasserstein距离 | 解决训练不稳定，提供有意义的损失度量 |
| **WGAN-GP** | 梯度惩罚 | 替代权重裁剪，进一步稳定训练 |
| **SNGAN** | 谱归一化 | 控制判别器的Lipschitz常数 |
| **BigGAN** | 大规模训练 | 类条件生成，正交正则化 |
| **ProGAN** | 渐进式增长 | 逐步增加分辨率，稳定高分辨率生成 |
| **Pix2Pix** | 条件GAN | 配对数据的图像到图像转换 |

---

## PyTorch实现

### 完整训练代码

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from torchvision.utils import save_image, make_grid
import os

class DCGAN:
    """
    完整的DCGAN实现
    """
    def __init__(
        self,
        latent_dim=100,
        img_channels=3,
        img_size=64,
        feature_maps=64,
        lr=0.0002,
        beta1=0.5,
        device='cuda'
    ):
        self.latent_dim = latent_dim
        self.device = device

        # 初始化生成器和判别器
        self.G = DCGANGenerator(latent_dim, feature_maps, img_channels).to(device)
        self.D = DCGANDiscriminator(img_channels, feature_maps).to(device)

        # 优化器
        self.g_optim = optim.Adam(self.G.parameters(), lr=lr, betas=(beta1, 0.999))
        self.d_optim = optim.Adam(self.D.parameters(), lr=lr, betas=(beta1, 0.999))

        # 损失函数
        self.criterion = nn.BCEWithLogitsLoss()

        # 固定噪声用于可视化
        self.fixed_noise = torch.randn(64, latent_dim, 1, 1, device=device)

        # 训练历史
        self.g_losses = []
        self.d_losses = []

    def train_step(self, real_images):
        batch_size = real_images.size(0)
        real_images = real_images.to(self.device)

        # 标签
        real_labels = torch.ones(batch_size, device=self.device)
        fake_labels = torch.zeros(batch_size, device=self.device)

        # ================== 训练判别器 ==================
        self.D.zero_grad()

        # 真实图像损失
        output_real = self.D(real_images)
        d_loss_real = self.criterion(output_real, real_labels)

        # 生成假图像
        noise = torch.randn(batch_size, self.latent_dim, 1, 1, device=self.device)
        fake_images = self.G(noise)

        # 假图像损失
        output_fake = self.D(fake_images.detach())
        d_loss_fake = self.criterion(output_fake, fake_labels)

        # 反向传播
        d_loss = d_loss_real + d_loss_fake
        d_loss.backward()
        self.d_optim.step()

        # ================== 训练生成器 ==================
        self.G.zero_grad()

        # 希望判别器将假图像判为真
        output = self.D(fake_images)
        g_loss = self.criterion(output, real_labels)

        g_loss.backward()
        self.g_optim.step()

        return d_loss.item(), g_loss.item()

    def train(self, dataloader, num_epochs, save_dir='./results'):
        os.makedirs(save_dir, exist_ok=True)

        for epoch in range(num_epochs):
            d_loss_avg = 0
            g_loss_avg = 0

            for i, (real_images, _) in enumerate(dataloader):
                d_loss, g_loss = self.train_step(real_images)

                d_loss_avg += d_loss
                g_loss_avg += g_loss

                if i % 100 == 0:
                    print(f'Epoch [{epoch+1}/{num_epochs}] Batch [{i}/{len(dataloader)}] '
                          f'D_loss: {d_loss:.4f} G_loss: {g_loss:.4f}')

            # 记录平均损失
            self.d_losses.append(d_loss_avg / len(dataloader))
            self.g_losses.append(g_loss_avg / len(dataloader))

            # 保存生成的图像
            with torch.no_grad():
                fake = self.G(self.fixed_noise)
                save_image(fake, f'{save_dir}/epoch_{epoch+1}.png',
                          normalize=True, nrow=8)

            # 保存模型检查点
            if (epoch + 1) % 10 == 0:
                self.save_checkpoint(f'{save_dir}/checkpoint_epoch_{epoch+1}.pt')

    def save_checkpoint(self, path):
        torch.save({
            'generator': self.G.state_dict(),
            'discriminator': self.D.state_dict(),
            'g_optimizer': self.g_optim.state_dict(),
            'd_optimizer': self.d_optim.state_dict(),
            'g_losses': self.g_losses,
            'd_losses': self.d_losses,
        }, path)

    def load_checkpoint(self, path):
        checkpoint = torch.load(path)
        self.G.load_state_dict(checkpoint['generator'])
        self.D.load_state_dict(checkpoint['discriminator'])
        self.g_optim.load_state_dict(checkpoint['g_optimizer'])
        self.d_optim.load_state_dict(checkpoint['d_optimizer'])
        self.g_losses = checkpoint['g_losses']
        self.d_losses = checkpoint['d_losses']

    def generate(self, num_samples=16):
        """生成新样本"""
        self.G.eval()
        with torch.no_grad():
            noise = torch.randn(num_samples, self.latent_dim, 1, 1, device=self.device)
            fake_images = self.G(noise)
        return fake_images


# 使用示例
def main():
    # 数据准备
    transform = transforms.Compose([
        transforms.Resize(64),
        transforms.CenterCrop(64),
        transforms.ToTensor(),
        transforms.Normalize([0.5, 0.5, 0.5], [0.5, 0.5, 0.5])
    ])

    dataset = datasets.CIFAR10(
        root='./data',
        train=True,
        download=True,
        transform=transform
    )

    dataloader = DataLoader(
        dataset,
        batch_size=128,
        shuffle=True,
        num_workers=4
    )

    # 训练GAN
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    gan = DCGAN(device=device)
    gan.train(dataloader, num_epochs=100)


if __name__ == '__main__':
    main()
```

### 评估指标

```python
import torch
import numpy as np
from scipy import linalg
from torchvision.models import inception_v3
from torch.nn.functional import adaptive_avg_pool2d

class InceptionScore:
    """
    Inception Score (IS)
    衡量生成图像的质量和多样性
    """
    def __init__(self, device='cuda'):
        self.device = device
        self.inception = inception_v3(pretrained=True, transform_input=False)
        self.inception = self.inception.to(device)
        self.inception.eval()

    def calculate(self, images, splits=10):
        """
        计算Inception Score

        Args:
            images: 生成的图像 (N, 3, 299, 299)
            splits: 分割数量
        """
        N = len(images)

        # 获取预测
        preds = []
        with torch.no_grad():
            for i in range(0, N, 32):
                batch = images[i:i+32].to(self.device)
                pred = torch.softmax(self.inception(batch), dim=1)
                preds.append(pred.cpu().numpy())

        preds = np.concatenate(preds, axis=0)

        # 计算IS
        scores = []
        for k in range(splits):
            part = preds[k * (N // splits): (k + 1) * (N // splits)]
            kl = part * (np.log(part) - np.log(np.mean(part, axis=0, keepdims=True)))
            kl = np.mean(np.sum(kl, axis=1))
            scores.append(np.exp(kl))

        return np.mean(scores), np.std(scores)


class FID:
    """
    Frechet Inception Distance (FID)
    衡量生成分布与真实分布的距离
    """
    def __init__(self, device='cuda'):
        self.device = device
        self.inception = inception_v3(pretrained=True, transform_input=False)
        self.inception.fc = nn.Identity()  # 移除分类层
        self.inception = self.inception.to(device)
        self.inception.eval()

    def get_features(self, images):
        """提取Inception特征"""
        features = []
        with torch.no_grad():
            for i in range(0, len(images), 32):
                batch = images[i:i+32].to(self.device)
                feat = self.inception(batch)
                features.append(feat.cpu().numpy())
        return np.concatenate(features, axis=0)

    def calculate(self, real_images, fake_images):
        """
        计算FID分数
        """
        # 提取特征
        real_features = self.get_features(real_images)
        fake_features = self.get_features(fake_images)

        # 计算均值和协方差
        mu1, sigma1 = np.mean(real_features, axis=0), np.cov(real_features, rowvar=False)
        mu2, sigma2 = np.mean(fake_features, axis=0), np.cov(fake_features, rowvar=False)

        # 计算FID
        diff = mu1 - mu2
        covmean, _ = linalg.sqrtm(sigma1.dot(sigma2), disp=False)

        if np.iscomplexobj(covmean):
            covmean = covmean.real

        fid = diff.dot(diff) + np.trace(sigma1 + sigma2 - 2 * covmean)

        return fid
```

---

## 应用场景

### 图像生成与增强

```python
class ImageGenerationPipeline:
    """图像生成应用管道"""

    def __init__(self, generator, device='cuda'):
        self.generator = generator.to(device)
        self.generator.eval()
        self.device = device

    def generate_samples(self, num_samples, latent_dim=100):
        """生成随机样本"""
        with torch.no_grad():
            z = torch.randn(num_samples, latent_dim, 1, 1, device=self.device)
            samples = self.generator(z)
        return samples

    def interpolate(self, z1, z2, steps=10):
        """
        潜在空间插值
        实现图像之间的平滑过渡
        """
        alphas = torch.linspace(0, 1, steps, device=self.device)
        interpolations = []

        with torch.no_grad():
            for alpha in alphas:
                z_interp = (1 - alpha) * z1 + alpha * z2
                img = self.generator(z_interp)
                interpolations.append(img)

        return torch.cat(interpolations, dim=0)

    def style_mixing(self, z1, z2, mixing_layer=4):
        """
        风格混合（用于StyleGAN）
        将一个样本的粗粒度特征与另一个的细粒度特征结合
        """
        # 这需要修改的StyleGAN生成器
        pass
```

### 图像超分辨率（SRGAN）

```python
class SRResidualBlock(nn.Module):
    """超分辨率残差块"""
    def __init__(self, channels):
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv2d(channels, channels, 3, 1, 1),
            nn.BatchNorm2d(channels),
            nn.PReLU(),
            nn.Conv2d(channels, channels, 3, 1, 1),
            nn.BatchNorm2d(channels),
        )

    def forward(self, x):
        return x + self.block(x)


class SRGenerator(nn.Module):
    """
    超分辨率生成器
    将低分辨率图像放大4倍
    """
    def __init__(self, in_channels=3, num_residual=16):
        super().__init__()

        # 初始卷积
        self.conv1 = nn.Sequential(
            nn.Conv2d(in_channels, 64, 9, 1, 4),
            nn.PReLU(),
        )

        # 残差块
        self.residual_blocks = nn.Sequential(
            *[SRResidualBlock(64) for _ in range(num_residual)]
        )

        self.conv2 = nn.Sequential(
            nn.Conv2d(64, 64, 3, 1, 1),
            nn.BatchNorm2d(64),
        )

        # 上采样
        self.upsample = nn.Sequential(
            nn.Conv2d(64, 256, 3, 1, 1),
            nn.PixelShuffle(2),
            nn.PReLU(),
            nn.Conv2d(64, 256, 3, 1, 1),
            nn.PixelShuffle(2),
            nn.PReLU(),
        )

        self.conv3 = nn.Conv2d(64, in_channels, 9, 1, 4)

    def forward(self, x):
        x1 = self.conv1(x)
        x = self.residual_blocks(x1)
        x = self.conv2(x) + x1
        x = self.upsample(x)
        x = self.conv3(x)
        return torch.tanh(x)
```

### 数据增强

```python
class GANDataAugmentation:
    """
    使用GAN进行数据增强
    特别适用于小样本学习场景
    """
    def __init__(self, generator, transform=None):
        self.generator = generator
        self.transform = transform

    def generate_augmented_samples(self, class_label, num_samples, latent_dim=100):
        """
        生成特定类别的增强样本
        需要使用条件GAN
        """
        z = torch.randn(num_samples, latent_dim)
        labels = torch.full((num_samples,), class_label, dtype=torch.long)

        with torch.no_grad():
            fake_samples = self.generator(z, labels)

        if self.transform:
            fake_samples = self.transform(fake_samples)

        return fake_samples

    def balance_dataset(self, dataset, target_count_per_class):
        """
        平衡不均衡数据集
        为少数类生成更多样本
        """
        class_counts = {}
        for _, label in dataset:
            class_counts[label] = class_counts.get(label, 0) + 1

        augmented_samples = []

        for class_label, count in class_counts.items():
            if count < target_count_per_class:
                num_to_generate = target_count_per_class - count
                fake_samples = self.generate_augmented_samples(
                    class_label, num_to_generate
                )
                augmented_samples.extend(fake_samples)

        return augmented_samples
```

### 图像编辑与操作

```python
class ImageEditor:
    """
    基于GAN的图像编辑器
    """
    def __init__(self, encoder, generator, device='cuda'):
        self.encoder = encoder.to(device)
        self.generator = generator.to(device)
        self.device = device

    def encode_image(self, image):
        """将图像编码到潜在空间"""
        with torch.no_grad():
            z = self.encoder(image.to(self.device))
        return z

    def edit_attribute(self, image, attribute_vector, strength=1.0):
        """
        编辑图像属性
        attribute_vector: 预计算的属性方向向量
        """
        z = self.encode_image(image)
        z_edited = z + strength * attribute_vector

        with torch.no_grad():
            edited_image = self.generator(z_edited)

        return edited_image

    def face_aging(self, image, age_direction, target_age_delta):
        """人脸老化/年轻化"""
        return self.edit_attribute(image, age_direction, target_age_delta)

    def expression_transfer(self, source_image, target_expression_vector):
        """表情迁移"""
        z = self.encode_image(source_image)
        # 替换表情相关的潜在维度
        z_new = z.clone()
        z_new[:, :10] = target_expression_vector  # 假设前10个维度控制表情

        with torch.no_grad():
            new_image = self.generator(z_new)

        return new_image
```

---

## 训练技巧与最佳实践

### 网络架构技巧

```python
# 谱归一化（Spectral Normalization）
import torch.nn.functional as F

class SpectralNormLayer(nn.Module):
    """
    谱归一化层
    控制判别器的Lipschitz常数，稳定训练
    """
    def __init__(self, module, name='weight', n_power_iterations=1):
        super().__init__()
        self.module = module
        self.name = name
        self.n_power_iterations = n_power_iterations
        self._make_params()

    def _make_params(self):
        weight = getattr(self.module, self.name)
        height = weight.size(0)
        width = weight.view(height, -1).size(1)

        u = weight.new_empty(height).normal_(0, 1)
        v = weight.new_empty(width).normal_(0, 1)

        self.register_buffer('u', u)
        self.register_buffer('v', v)

    def _update_vectors(self):
        weight = getattr(self.module, self.name)
        height = weight.size(0)
        weight_mat = weight.view(height, -1)

        with torch.no_grad():
            for _ in range(self.n_power_iterations):
                self.v = F.normalize(weight_mat.t() @ self.u, dim=0)
                self.u = F.normalize(weight_mat @ self.v, dim=0)

    def forward(self, *args, **kwargs):
        self._update_vectors()
        weight = getattr(self.module, self.name)
        height = weight.size(0)
        weight_mat = weight.view(height, -1)
        sigma = (self.u @ weight_mat @ self.v).item()

        # 归一化权重
        setattr(self.module, self.name, weight / sigma)
        output = self.module(*args, **kwargs)
        setattr(self.module, self.name, weight)

        return output


# 使用PyTorch内置的谱归一化
from torch.nn.utils import spectral_norm

discriminator_with_sn = nn.Sequential(
    spectral_norm(nn.Conv2d(3, 64, 4, 2, 1)),
    nn.LeakyReLU(0.2),
    spectral_norm(nn.Conv2d(64, 128, 4, 2, 1)),
    nn.LeakyReLU(0.2),
    spectral_norm(nn.Conv2d(128, 256, 4, 2, 1)),
    nn.LeakyReLU(0.2),
    spectral_norm(nn.Conv2d(256, 1, 4, 1, 0)),
)
```

### 损失函数变体

```python
class GANLosses:
    """各种GAN损失函数"""

    @staticmethod
    def vanilla_loss(d_real, d_fake):
        """原始GAN损失"""
        d_loss = -torch.mean(torch.log(d_real + 1e-8) + torch.log(1 - d_fake + 1e-8))
        g_loss = -torch.mean(torch.log(d_fake + 1e-8))
        return d_loss, g_loss

    @staticmethod
    def lsgan_loss(d_real, d_fake):
        """最小二乘GAN损失（LSGAN）"""
        d_loss = 0.5 * (torch.mean((d_real - 1) ** 2) + torch.mean(d_fake ** 2))
        g_loss = 0.5 * torch.mean((d_fake - 1) ** 2)
        return d_loss, g_loss

    @staticmethod
    def hinge_loss(d_real, d_fake):
        """Hinge损失"""
        d_loss = torch.mean(torch.relu(1 - d_real)) + torch.mean(torch.relu(1 + d_fake))
        g_loss = -torch.mean(d_fake)
        return d_loss, g_loss

    @staticmethod
    def wasserstein_loss_fn(d_real, d_fake):
        """Wasserstein损失"""
        d_loss = -torch.mean(d_real) + torch.mean(d_fake)
        g_loss = -torch.mean(d_fake)
        return d_loss, g_loss

    @staticmethod
    def gradient_penalty(discriminator, real_samples, fake_samples, device):
        """
        WGAN-GP的梯度惩罚
        """
        batch_size = real_samples.size(0)
        alpha = torch.rand(batch_size, 1, 1, 1, device=device)

        interpolates = alpha * real_samples + (1 - alpha) * fake_samples
        interpolates.requires_grad_(True)

        d_interpolates = discriminator(interpolates)

        gradients = torch.autograd.grad(
            outputs=d_interpolates,
            inputs=interpolates,
            grad_outputs=torch.ones_like(d_interpolates),
            create_graph=True,
            retain_graph=True,
        )[0]

        gradients = gradients.view(batch_size, -1)
        gradient_penalty = ((gradients.norm(2, dim=1) - 1) ** 2).mean()

        return gradient_penalty
```

### 训练稳定性技巧

```python
class StableGANTrainer:
    """稳定的GAN训练器"""

    def __init__(self, G, D, device='cuda'):
        self.G = G.to(device)
        self.D = D.to(device)
        self.device = device

        # 使用不同的学习率
        self.g_optimizer = optim.Adam(G.parameters(), lr=0.0001, betas=(0.0, 0.999))
        self.d_optimizer = optim.Adam(D.parameters(), lr=0.0004, betas=(0.0, 0.999))

        # 指数移动平均
        self.g_ema = self._copy_model(G)
        self.ema_decay = 0.999

    def _copy_model(self, model):
        """创建模型副本用于EMA"""
        model_copy = type(model)().to(self.device)
        model_copy.load_state_dict(model.state_dict())
        model_copy.eval()
        return model_copy

    def _update_ema(self):
        """更新指数移动平均"""
        with torch.no_grad():
            for p_ema, p in zip(self.g_ema.parameters(), self.G.parameters()):
                p_ema.data.mul_(self.ema_decay).add_(p.data, alpha=1 - self.ema_decay)

    def train_step(self, real_images, n_critic=5):
        """
        训练一步
        n_critic: 每训练G一次，训练D的次数
        """
        batch_size = real_images.size(0)

        # 训练判别器多次
        for _ in range(n_critic):
            self.D.zero_grad()

            # 真实样本
            d_real = self.D(real_images)

            # 假样本
            z = torch.randn(batch_size, self.G.latent_dim, device=self.device)
            fake_images = self.G(z).detach()
            d_fake = self.D(fake_images)

            # WGAN-GP损失
            d_loss, _ = GANLosses.wasserstein_loss_fn(d_real, d_fake)
            gp = GANLosses.gradient_penalty(self.D, real_images, fake_images, self.device)
            d_loss = d_loss + 10 * gp

            d_loss.backward()
            self.d_optimizer.step()

        # 训练生成器
        self.G.zero_grad()

        z = torch.randn(batch_size, self.G.latent_dim, device=self.device)
        fake_images = self.G(z)
        d_fake = self.D(fake_images)

        g_loss = -torch.mean(d_fake)
        g_loss.backward()
        self.g_optimizer.step()

        # 更新EMA
        self._update_ema()

        return d_loss.item(), g_loss.item()

    def generate_with_ema(self, num_samples):
        """使用EMA模型生成样本（通常质量更高）"""
        z = torch.randn(num_samples, self.G.latent_dim, device=self.device)
        with torch.no_grad():
            samples = self.g_ema(z)
        return samples
```

### 调试与监控

```python
import matplotlib.pyplot as plt

class GANMonitor:
    """GAN训练监控器"""

    def __init__(self, log_dir='./logs'):
        self.log_dir = log_dir
        self.d_losses = []
        self.g_losses = []
        self.d_real_scores = []
        self.d_fake_scores = []

    def log_step(self, d_loss, g_loss, d_real_score, d_fake_score):
        """记录训练步骤"""
        self.d_losses.append(d_loss)
        self.g_losses.append(g_loss)
        self.d_real_scores.append(d_real_score)
        self.d_fake_scores.append(d_fake_score)

    def plot_losses(self):
        """绘制损失曲线"""
        fig, axes = plt.subplots(1, 2, figsize=(12, 4))

        axes[0].plot(self.d_losses, label='Discriminator')
        axes[0].plot(self.g_losses, label='Generator')
        axes[0].set_xlabel('Iteration')
        axes[0].set_ylabel('Loss')
        axes[0].legend()
        axes[0].set_title('Training Losses')

        axes[1].plot(self.d_real_scores, label='D(x) - Real')
        axes[1].plot(self.d_fake_scores, label='D(G(z)) - Fake')
        axes[1].set_xlabel('Iteration')
        axes[1].set_ylabel('Score')
        axes[1].legend()
        axes[1].set_title('Discriminator Scores')

        plt.tight_layout()
        plt.savefig(f'{self.log_dir}/training_curves.png')
        plt.close()

    def check_mode_collapse(self, samples, threshold=0.1):
        """
        检测模式崩溃
        通过检查生成样本的多样性
        """
        # 计算样本间的平均距离
        samples_flat = samples.view(samples.size(0), -1)
        distances = torch.cdist(samples_flat, samples_flat)

        # 排除对角线
        mask = ~torch.eye(samples.size(0), dtype=bool, device=samples.device)
        avg_distance = distances[mask].mean().item()

        if avg_distance < threshold:
            print(f"警告：检测到可能的模式崩溃！平均样本距离: {avg_distance:.4f}")
            return True
        return False
```

---

## 面试要点

### 核心概念问题

**Q1: GAN的基本原理是什么？**

A: GAN由生成器G和判别器D组成，通过对抗博弈进行训练：
- G学习将随机噪声映射到数据分布
- D学习区分真实样本和生成样本
- 目标函数是minimax博弈：$\min_G \max_D V(D,G)$
- 最终达到纳什均衡，G生成的样本与真实数据不可区分

**Q2: 如何理解GAN的损失函数？**

A: GAN的损失函数包含两部分：
```
判别器损失: max E[log D(x)] + E[log(1 - D(G(z)))]
生成器损失: min E[log(1 - D(G(z)))]  或  max E[log D(G(z))]
```
第二种生成器损失（非饱和损失）在实践中更常用，因为它提供更强的梯度信号。

**Q3: 什么是模式崩溃？如何解决？**

A: 模式崩溃是指生成器只能产生有限种类的样本。解决方法包括：
- Mini-batch discrimination：让D看到批次统计信息
- Feature matching：匹配中间层特征而非最终输出
- Wasserstein距离（WGAN）：使用更稳定的距离度量
- 谱归一化：控制D的Lipschitz常数
- 多样性正则化

### 架构设计问题

**Q4: DCGAN的关键设计原则是什么？**

A:
1. 使用步长卷积代替池化
2. 生成器使用ReLU，输出层用Tanh
3. 判别器使用LeakyReLU
4. 使用BatchNorm（D的输入层和G的输出层除外）
5. 权重初始化用均值0，标准差0.02的正态分布

**Q5: StyleGAN相比传统GAN有什么改进？**

A:
1. 映射网络：将z映射到中间潜在空间w
2. 自适应实例归一化（AdaIN）：实现风格注入
3. 噪声注入：在每层添加随机噪声产生细节变化
4. 渐进式训练：从低分辨率逐步增加
5. 风格混合：支持不同层级的风格控制

### 训练与评估问题

**Q6: 如何评估GAN生成图像的质量？**

A: 主要评估指标：
- **IS（Inception Score）**：衡量生成图像的质量和多样性
- **FID（Frechet Inception Distance）**：衡量生成分布与真实分布的距离
- **LPIPS**：感知相似度度量
- 人工评估：主观质量评价

**Q7: GAN训练不稳定的原因和解决方法？**

A: 原因：
- 判别器过强导致梯度消失
- G和D的能力不均衡
- JS散度在分布不重叠时不连续

解决方法：
- 使用WGAN/WGAN-GP
- 谱归一化
- 标签平滑
- 调整G和D的训练比例
- 使用适当的学习率和优化器

### 代码实现问题

**Q8: 写出GAN的核心训练循环**

```python
for epoch in range(num_epochs):
    for real_images, _ in dataloader:
        batch_size = real_images.size(0)

        # 1. 训练判别器
        D.zero_grad()

        # 真实样本
        d_real = D(real_images)
        d_real_loss = criterion(d_real, torch.ones_like(d_real))

        # 假样本
        z = torch.randn(batch_size, latent_dim)
        fake_images = G(z).detach()
        d_fake = D(fake_images)
        d_fake_loss = criterion(d_fake, torch.zeros_like(d_fake))

        d_loss = d_real_loss + d_fake_loss
        d_loss.backward()
        d_optimizer.step()

        # 2. 训练生成器
        G.zero_grad()

        fake_images = G(z)
        d_fake = D(fake_images)
        g_loss = criterion(d_fake, torch.ones_like(d_fake))

        g_loss.backward()
        g_optimizer.step()
```

### 应用场景问题

**Q9: GAN有哪些实际应用？**

A:
1. **图像生成**：人脸生成、艺术创作
2. **图像编辑**：属性编辑、风格迁移
3. **超分辨率**：图像放大
4. **图像修复**：Inpainting
5. **数据增强**：生成训练数据
6. **域适应**：跨域图像转换
7. **视频生成**：生成视频帧
8. **3D生成**：生成3D模型

---

## 总结

GAN作为生成模型的里程碑，开创了对抗训练的新范式。从最初的原始GAN到如今的StyleGAN3，GAN技术不断演进，解决了训练稳定性、模式崩溃等核心问题。

### 核心要点

1. **对抗博弈思想**：生成器和判别器相互博弈，共同进步
2. **架构设计**：DCGAN确立了卷积GAN的标准架构
3. **训练稳定性**：WGAN-GP、谱归一化等技术显著改善训练
4. **高质量生成**：StyleGAN系列实现了照片级真实的图像生成
5. **多样化应用**：从图像生成扩展到编辑、超分辨率等多个领域

### 学习路线建议

1. 掌握原始GAN的数学原理和代码实现
2. 理解DCGAN的架构设计原则
3. 学习WGAN/WGAN-GP解决训练稳定性问题
4. 研究StyleGAN的风格控制机制
5. 实践具体应用如图像生成、风格迁移等

GAN的发展推动了整个生成式AI领域的进步，为后续的扩散模型等技术奠定了基础。深入理解GAN的原理和实现，对于从事计算机视觉和生成式AI的研究者和工程师都至关重要。
