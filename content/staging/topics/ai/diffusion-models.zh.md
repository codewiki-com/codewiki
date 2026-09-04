---
title: 扩散模型 (Diffusion Models)
description: 学习扩散模型的原理和图像生成应用
track: ai
section: deep-learning
difficulty: advanced
tags:
  - 扩散模型
  - Stable Diffusion
  - 图像生成
  - DALL-E
status: imported
origin: old/src/content/docs/ai/diffusion-models.zh.md
divergence: 0.342
issues: []
legacy:
  category: AI
  subcategory: Deep Learning
  order: 17
  lastUpdated: 2026-01-07
---

扩散模型是近年来生成式AI领域最具突破性的技术之一，它在图像生成、视频合成、音频生成等多个领域取得了令人瞩目的成果。Stable Diffusion、DALL-E、Midjourney等知名模型都基于扩散模型架构。本文将深入讲解扩散模型的数学原理、核心算法和实际应用。

---

## 扩散过程基础

### 什么是扩散模型

扩散模型的核心思想来源于非平衡热力学。它包含两个过程：

1. **前向扩散过程（Forward Diffusion）**：逐步向数据添加噪声，直到数据变成纯噪声
2. **逆向去噪过程（Reverse Denoising）**：学习如何逐步去除噪声，从纯噪声恢复原始数据

这个过程可以类比为：墨水滴入水中逐渐扩散（前向过程），然后学习如何将扩散的墨水重新聚集回来（逆向过程）。

```python
import torch
import torch.nn as nn
import numpy as np
import matplotlib.pyplot as plt

def visualize_diffusion_process(image, num_steps=10):
    """可视化前向扩散过程"""
    fig, axes = plt.subplots(1, num_steps + 1, figsize=(20, 2))

    # 原始图像
    axes[0].imshow(image)
    axes[0].set_title('t=0 (原图)')
    axes[0].axis('off')

    # 逐步添加噪声
    noisy_image = image.copy()
    for t in range(1, num_steps + 1):
        # 计算当前时间步的噪声水平
        beta_t = t / num_steps * 0.02  # 线性调度
        noise = np.random.randn(*image.shape) * np.sqrt(beta_t)
        noisy_image = np.sqrt(1 - beta_t) * noisy_image + noise

        axes[t].imshow(np.clip(noisy_image, 0, 1))
        axes[t].set_title(f't={t}')
        axes[t].axis('off')

    plt.tight_layout()
    plt.savefig('diffusion_process.png')
    plt.show()
```

### 数学形式化

#### 前向过程（Forward Process）

前向扩散过程是一个马尔可夫链，在每个时间步 $t$ 向数据添加高斯噪声：

$$q(\mathbf{x}_t | \mathbf{x}_{t-1}) = \mathcal{N}(\mathbf{x}_t; \sqrt{1-\beta_t}\mathbf{x}_{t-1}, \beta_t\mathbf{I})$$

其中 $\beta_t$ 是噪声调度（noise schedule），控制每一步添加的噪声量。通常 $\beta_t \in (0, 1)$ 且随时间递增。

**关键性质：可以直接从 $\mathbf{x}_0$ 采样任意时刻的 $\mathbf{x}_t$**

定义 $\alpha_t = 1 - \beta_t$ 和 $\bar{\alpha}_t = \prod_{s=1}^{t} \alpha_s$，则：

$$q(\mathbf{x}_t | \mathbf{x}_0) = \mathcal{N}(\mathbf{x}_t; \sqrt{\bar{\alpha}_t}\mathbf{x}_0, (1-\bar{\alpha}_t)\mathbf{I})$$

这意味着：

$$\mathbf{x}_t = \sqrt{\bar{\alpha}_t}\mathbf{x}_0 + \sqrt{1-\bar{\alpha}_t}\boldsymbol{\epsilon}, \quad \boldsymbol{\epsilon} \sim \mathcal{N}(\mathbf{0}, \mathbf{I})$$

```python
class DiffusionSchedule:
    """扩散过程的噪声调度器"""

    def __init__(self, num_timesteps=1000, beta_start=1e-4, beta_end=0.02, schedule_type='linear'):
        self.num_timesteps = num_timesteps

        if schedule_type == 'linear':
            # 线性调度
            self.betas = torch.linspace(beta_start, beta_end, num_timesteps)
        elif schedule_type == 'cosine':
            # 余弦调度（通常效果更好）
            self.betas = self._cosine_schedule(num_timesteps)
        elif schedule_type == 'quadratic':
            # 二次调度
            self.betas = torch.linspace(beta_start**0.5, beta_end**0.5, num_timesteps) ** 2

        # 计算alpha相关参数
        self.alphas = 1.0 - self.betas
        self.alphas_cumprod = torch.cumprod(self.alphas, dim=0)
        self.alphas_cumprod_prev = torch.cat([torch.tensor([1.0]), self.alphas_cumprod[:-1]])

        # 预计算用于采样的系数
        self.sqrt_alphas_cumprod = torch.sqrt(self.alphas_cumprod)
        self.sqrt_one_minus_alphas_cumprod = torch.sqrt(1.0 - self.alphas_cumprod)
        self.sqrt_recip_alphas = torch.sqrt(1.0 / self.alphas)

        # 后验分布的方差
        self.posterior_variance = self.betas * (1.0 - self.alphas_cumprod_prev) / (1.0 - self.alphas_cumprod)

    def _cosine_schedule(self, num_timesteps, s=0.008):
        """余弦噪声调度，来自Improved DDPM论文"""
        steps = num_timesteps + 1
        x = torch.linspace(0, num_timesteps, steps)
        alphas_cumprod = torch.cos(((x / num_timesteps) + s) / (1 + s) * torch.pi * 0.5) ** 2
        alphas_cumprod = alphas_cumprod / alphas_cumprod[0]
        betas = 1 - (alphas_cumprod[1:] / alphas_cumprod[:-1])
        return torch.clamp(betas, 0.0001, 0.9999)

    def add_noise(self, x_0, t, noise=None):
        """
        前向扩散：给定x_0和时间步t，采样x_t
        x_t = sqrt(alpha_bar_t) * x_0 + sqrt(1 - alpha_bar_t) * epsilon
        """
        if noise is None:
            noise = torch.randn_like(x_0)

        sqrt_alpha_bar = self.sqrt_alphas_cumprod[t].view(-1, 1, 1, 1)
        sqrt_one_minus_alpha_bar = self.sqrt_one_minus_alphas_cumprod[t].view(-1, 1, 1, 1)

        return sqrt_alpha_bar * x_0 + sqrt_one_minus_alpha_bar * noise

# 使用示例
schedule = DiffusionSchedule(num_timesteps=1000, schedule_type='cosine')

# 对一批图像添加噪声
batch_size = 4
x_0 = torch.randn(batch_size, 3, 64, 64)  # 原始图像
t = torch.randint(0, 1000, (batch_size,))  # 随机时间步
epsilon = torch.randn_like(x_0)  # 随机噪声

x_t = schedule.add_noise(x_0, t, epsilon)
print(f"输入形状: {x_0.shape}, 输出形状: {x_t.shape}")
```

### 噪声调度的重要性

噪声调度（Noise Schedule）决定了扩散过程中噪声添加的速率，对模型性能有重要影响：

| 调度类型 | 公式 | 特点 |
|---------|------|------|
| 线性调度 | $\beta_t = \beta_1 + \frac{t-1}{T-1}(\beta_T - \beta_1)$ | 简单，但后期噪声变化过快 |
| 余弦调度 | $\bar{\alpha}_t = \frac{f(t)}{f(0)}$，$f(t) = \cos^2(\frac{t/T + s}{1+s} \cdot \frac{\pi}{2})$ | 更平滑，适用于高分辨率 |
| Sigmoid调度 | $\beta_t = \sigma(-6 + 12\frac{t}{T})$ | 平衡线性和余弦的特点 |

```python
def compare_schedules(num_timesteps=1000):
    """比较不同噪声调度"""
    schedules = {
        'linear': DiffusionSchedule(num_timesteps, schedule_type='linear'),
        'cosine': DiffusionSchedule(num_timesteps, schedule_type='cosine'),
        'quadratic': DiffusionSchedule(num_timesteps, schedule_type='quadratic'),
    }

    plt.figure(figsize=(12, 4))

    # 绘制beta曲线
    plt.subplot(1, 2, 1)
    for name, schedule in schedules.items():
        plt.plot(schedule.betas.numpy(), label=name)
    plt.xlabel('Timestep')
    plt.ylabel('Beta')
    plt.title('噪声调度 Beta 曲线')
    plt.legend()

    # 绘制alpha_bar曲线
    plt.subplot(1, 2, 2)
    for name, schedule in schedules.items():
        plt.plot(schedule.alphas_cumprod.numpy(), label=name)
    plt.xlabel('Timestep')
    plt.ylabel('Alpha Bar')
    plt.title('累积Alpha曲线')
    plt.legend()

    plt.tight_layout()
    plt.savefig('schedule_comparison.png')
    plt.show()
```

---

## 去噪过程

### 逆向过程的数学推导

逆向过程的目标是学习从 $\mathbf{x}_t$ 恢复 $\mathbf{x}_{t-1}$。真实的逆向分布 $q(\mathbf{x}_{t-1}|\mathbf{x}_t)$ 依赖于整个数据分布，无法直接计算。但给定 $\mathbf{x}_0$，后验分布是可解析的：

$$q(\mathbf{x}_{t-1}|\mathbf{x}_t, \mathbf{x}_0) = \mathcal{N}(\mathbf{x}_{t-1}; \tilde{\boldsymbol{\mu}}_t(\mathbf{x}_t, \mathbf{x}_0), \tilde{\beta}_t\mathbf{I})$$

其中：

$$\tilde{\boldsymbol{\mu}}_t(\mathbf{x}_t, \mathbf{x}_0) = \frac{\sqrt{\bar{\alpha}_{t-1}}\beta_t}{1-\bar{\alpha}_t}\mathbf{x}_0 + \frac{\sqrt{\alpha_t}(1-\bar{\alpha}_{t-1})}{1-\bar{\alpha}_t}\mathbf{x}_t$$

$$\tilde{\beta}_t = \frac{1-\bar{\alpha}_{t-1}}{1-\bar{\alpha}_t}\beta_t$$

### 神经网络参数化

由于我们不知道真实的 $\mathbf{x}_0$，需要用神经网络来估计。有三种等价的参数化方式：

1. **预测噪声 $\boldsymbol{\epsilon}_\theta$**（最常用）：
   $$\hat{\mathbf{x}}_0 = \frac{\mathbf{x}_t - \sqrt{1-\bar{\alpha}_t}\boldsymbol{\epsilon}_\theta(\mathbf{x}_t, t)}{\sqrt{\bar{\alpha}_t}}$$

2. **预测原始数据 $\mathbf{x}_\theta$**：
   $$\hat{\mathbf{x}}_0 = \mathbf{x}_\theta(\mathbf{x}_t, t)$$

3. **预测速度 $\mathbf{v}_\theta$**：
   $$\mathbf{v} = \sqrt{\bar{\alpha}_t}\boldsymbol{\epsilon} - \sqrt{1-\bar{\alpha}_t}\mathbf{x}_0$$

```python
class DenoisingNetwork(nn.Module):
    """简化版去噪网络，展示核心概念"""

    def __init__(self, in_channels=3, hidden_dim=128, prediction_type='epsilon'):
        super().__init__()
        self.prediction_type = prediction_type

        # 时间嵌入
        self.time_embed = nn.Sequential(
            SinusoidalPositionEmbeddings(hidden_dim),
            nn.Linear(hidden_dim, hidden_dim * 4),
            nn.GELU(),
            nn.Linear(hidden_dim * 4, hidden_dim),
        )

        # 编码器-解码器结构（简化版UNet）
        self.encoder = nn.Sequential(
            nn.Conv2d(in_channels, hidden_dim, 3, padding=1),
            nn.GroupNorm(8, hidden_dim),
            nn.GELU(),
            nn.Conv2d(hidden_dim, hidden_dim * 2, 3, stride=2, padding=1),
            nn.GroupNorm(8, hidden_dim * 2),
            nn.GELU(),
        )

        self.middle = nn.Sequential(
            nn.Conv2d(hidden_dim * 2, hidden_dim * 2, 3, padding=1),
            nn.GroupNorm(8, hidden_dim * 2),
            nn.GELU(),
        )

        self.decoder = nn.Sequential(
            nn.ConvTranspose2d(hidden_dim * 2, hidden_dim, 4, stride=2, padding=1),
            nn.GroupNorm(8, hidden_dim),
            nn.GELU(),
            nn.Conv2d(hidden_dim, in_channels, 3, padding=1),
        )

        # 时间条件注入
        self.time_proj = nn.Linear(hidden_dim, hidden_dim * 2)

    def forward(self, x, t):
        """
        前向传播
        Args:
            x: 噪声图像 [B, C, H, W]
            t: 时间步 [B]
        Returns:
            预测值（噪声、原始数据或速度，取决于prediction_type）
        """
        # 时间嵌入
        t_emb = self.time_embed(t)  # [B, hidden_dim]
        t_emb = self.time_proj(t_emb)  # [B, hidden_dim * 2]

        # 编码
        h = self.encoder(x)

        # 添加时间条件（通过缩放和偏移）
        scale, shift = t_emb.chunk(2, dim=-1)
        h = h * (1 + scale[:, :, None, None]) + shift[:, :, None, None]

        # 中间层
        h = self.middle(h)

        # 解码
        output = self.decoder(h)

        return output


class SinusoidalPositionEmbeddings(nn.Module):
    """正弦位置嵌入，用于编码时间步"""

    def __init__(self, dim):
        super().__init__()
        self.dim = dim

    def forward(self, time):
        device = time.device
        half_dim = self.dim // 2
        embeddings = np.log(10000) / (half_dim - 1)
        embeddings = torch.exp(torch.arange(half_dim, device=device) * -embeddings)
        embeddings = time[:, None] * embeddings[None, :]
        embeddings = torch.cat((embeddings.sin(), embeddings.cos()), dim=-1)
        return embeddings
```

### 采样算法

给定训练好的去噪网络，可以通过迭代采样生成图像：

```python
class DDPMSampler:
    """DDPM采样器"""

    def __init__(self, model, schedule, device='cuda'):
        self.model = model
        self.schedule = schedule
        self.device = device

    @torch.no_grad()
    def sample(self, shape, num_steps=None):
        """
        从纯噪声生成图像
        Args:
            shape: 输出形状 [B, C, H, W]
            num_steps: 采样步数，默认使用全部时间步
        Returns:
            生成的图像
        """
        if num_steps is None:
            num_steps = self.schedule.num_timesteps

        # 从纯高斯噪声开始
        x = torch.randn(shape, device=self.device)

        # 逆向去噪
        for t in reversed(range(num_steps)):
            t_batch = torch.full((shape[0],), t, device=self.device, dtype=torch.long)

            # 预测噪声
            predicted_noise = self.model(x, t_batch)

            # 计算均值
            alpha = self.schedule.alphas[t]
            alpha_bar = self.schedule.alphas_cumprod[t]
            beta = self.schedule.betas[t]

            # x_{t-1} 的均值
            mean = (1 / torch.sqrt(alpha)) * (
                x - (beta / torch.sqrt(1 - alpha_bar)) * predicted_noise
            )

            # 添加噪声（除了最后一步）
            if t > 0:
                noise = torch.randn_like(x)
                sigma = torch.sqrt(self.schedule.posterior_variance[t])
                x = mean + sigma * noise
            else:
                x = mean

        return x

    @torch.no_grad()
    def sample_with_progress(self, shape, callback=None):
        """带进度回调的采样，用于可视化中间结果"""
        x = torch.randn(shape, device=self.device)
        intermediates = [x.clone()]

        for t in reversed(range(self.schedule.num_timesteps)):
            t_batch = torch.full((shape[0],), t, device=self.device, dtype=torch.long)

            predicted_noise = self.model(x, t_batch)

            alpha = self.schedule.alphas[t]
            alpha_bar = self.schedule.alphas_cumprod[t]
            beta = self.schedule.betas[t]

            mean = (1 / torch.sqrt(alpha)) * (
                x - (beta / torch.sqrt(1 - alpha_bar)) * predicted_noise
            )

            if t > 0:
                noise = torch.randn_like(x)
                sigma = torch.sqrt(self.schedule.posterior_variance[t])
                x = mean + sigma * noise
            else:
                x = mean

            # 保存中间结果
            if t % 100 == 0 or t == 0:
                intermediates.append(x.clone())
                if callback:
                    callback(t, x)

        return x, intermediates
```

---

## DDPM详解

### Denoising Diffusion Probabilistic Models

DDPM（Denoising Diffusion Probabilistic Models）是由Ho等人在2020年提出的里程碑式工作，奠定了现代扩散模型的基础。

#### 训练目标

DDPM的训练目标是最小化变分下界（Variational Lower Bound），经过简化后等价于：

$$L_{\text{simple}} = \mathbb{E}_{t, \mathbf{x}_0, \boldsymbol{\epsilon}} \left[ \| \boldsymbol{\epsilon} - \boldsymbol{\epsilon}_\theta(\mathbf{x}_t, t) \|^2 \right]$$

这是一个简单的均方误差损失，目标是让网络预测添加到图像中的噪声。

```python
class DDPMTrainer:
    """DDPM训练器"""

    def __init__(self, model, schedule, optimizer, device='cuda'):
        self.model = model.to(device)
        self.schedule = schedule
        self.optimizer = optimizer
        self.device = device
        self.loss_fn = nn.MSELoss()

    def train_step(self, x_0):
        """
        单步训练
        Args:
            x_0: 原始图像 [B, C, H, W]
        Returns:
            损失值
        """
        batch_size = x_0.shape[0]
        x_0 = x_0.to(self.device)

        # 1. 随机采样时间步
        t = torch.randint(0, self.schedule.num_timesteps, (batch_size,), device=self.device)

        # 2. 采样噪声
        noise = torch.randn_like(x_0)

        # 3. 前向扩散得到x_t
        x_t = self.schedule.add_noise(x_0, t, noise)

        # 4. 预测噪声
        predicted_noise = self.model(x_t, t)

        # 5. 计算损失
        loss = self.loss_fn(predicted_noise, noise)

        # 6. 反向传播
        self.optimizer.zero_grad()
        loss.backward()

        # 梯度裁剪
        torch.nn.utils.clip_grad_norm_(self.model.parameters(), 1.0)

        self.optimizer.step()

        return loss.item()

    def train_epoch(self, dataloader):
        """训练一个epoch"""
        self.model.train()
        total_loss = 0
        num_batches = 0

        for batch in dataloader:
            if isinstance(batch, (list, tuple)):
                x_0 = batch[0]  # 取图像，忽略标签
            else:
                x_0 = batch

            loss = self.train_step(x_0)
            total_loss += loss
            num_batches += 1

        return total_loss / num_batches


# 完整训练流程
def train_ddpm(model, train_loader, num_epochs=100, lr=1e-4):
    """训练DDPM模型"""
    schedule = DiffusionSchedule(num_timesteps=1000, schedule_type='cosine')
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=0.01)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=num_epochs)

    trainer = DDPMTrainer(model, schedule, optimizer)

    for epoch in range(num_epochs):
        avg_loss = trainer.train_epoch(train_loader)
        scheduler.step()

        if epoch % 10 == 0:
            print(f"Epoch {epoch}, Loss: {avg_loss:.4f}, LR: {scheduler.get_last_lr()[0]:.6f}")

            # 生成样本
            sampler = DDPMSampler(model, schedule)
            samples = sampler.sample((4, 3, 64, 64))
            # 保存或可视化samples

    return model
```

### UNet架构

DDPM使用UNet作为去噪网络，这是一种编码器-解码器架构，具有跳跃连接：

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class ResBlock(nn.Module):
    """残差块，带时间嵌入"""

    def __init__(self, in_channels, out_channels, time_dim, dropout=0.1):
        super().__init__()
        self.conv1 = nn.Conv2d(in_channels, out_channels, 3, padding=1)
        self.conv2 = nn.Conv2d(out_channels, out_channels, 3, padding=1)
        self.norm1 = nn.GroupNorm(8, in_channels)
        self.norm2 = nn.GroupNorm(8, out_channels)
        self.time_proj = nn.Linear(time_dim, out_channels)
        self.dropout = nn.Dropout(dropout)

        if in_channels != out_channels:
            self.shortcut = nn.Conv2d(in_channels, out_channels, 1)
        else:
            self.shortcut = nn.Identity()

    def forward(self, x, t_emb):
        h = self.norm1(x)
        h = F.silu(h)
        h = self.conv1(h)

        # 注入时间信息
        h = h + self.time_proj(F.silu(t_emb))[:, :, None, None]

        h = self.norm2(h)
        h = F.silu(h)
        h = self.dropout(h)
        h = self.conv2(h)

        return h + self.shortcut(x)


class AttentionBlock(nn.Module):
    """自注意力块"""

    def __init__(self, channels, num_heads=4):
        super().__init__()
        self.num_heads = num_heads
        self.norm = nn.GroupNorm(8, channels)
        self.attention = nn.MultiheadAttention(channels, num_heads, batch_first=True)

    def forward(self, x):
        b, c, h, w = x.shape

        # 归一化
        x_norm = self.norm(x)

        # 展平空间维度
        x_flat = x_norm.view(b, c, h * w).transpose(1, 2)  # [B, H*W, C]

        # 自注意力
        attn_out, _ = self.attention(x_flat, x_flat, x_flat)

        # 恢复形状
        attn_out = attn_out.transpose(1, 2).view(b, c, h, w)

        return x + attn_out


class UNet(nn.Module):
    """用于DDPM的UNet架构"""

    def __init__(
        self,
        in_channels=3,
        out_channels=3,
        model_channels=128,
        channel_mult=(1, 2, 4, 8),
        num_res_blocks=2,
        attention_resolutions=(16,),
        dropout=0.1,
        num_heads=4,
    ):
        super().__init__()

        time_dim = model_channels * 4

        # 时间嵌入
        self.time_embed = nn.Sequential(
            SinusoidalPositionEmbeddings(model_channels),
            nn.Linear(model_channels, time_dim),
            nn.SiLU(),
            nn.Linear(time_dim, time_dim),
        )

        # 输入卷积
        self.input_conv = nn.Conv2d(in_channels, model_channels, 3, padding=1)

        # 下采样路径
        self.down_blocks = nn.ModuleList()
        self.down_samples = nn.ModuleList()

        channels = model_channels
        current_resolution = 64  # 假设输入分辨率

        for level, mult in enumerate(channel_mult):
            out_channels_level = model_channels * mult

            # 残差块
            for _ in range(num_res_blocks):
                block = ResBlock(channels, out_channels_level, time_dim, dropout)
                self.down_blocks.append(block)

                # 在特定分辨率添加注意力
                if current_resolution in attention_resolutions:
                    self.down_blocks.append(AttentionBlock(out_channels_level, num_heads))

                channels = out_channels_level

            # 下采样（除了最后一层）
            if level < len(channel_mult) - 1:
                self.down_samples.append(nn.Conv2d(channels, channels, 3, stride=2, padding=1))
                current_resolution //= 2

        # 中间块
        self.middle_block1 = ResBlock(channels, channels, time_dim, dropout)
        self.middle_attn = AttentionBlock(channels, num_heads)
        self.middle_block2 = ResBlock(channels, channels, time_dim, dropout)

        # 上采样路径
        self.up_blocks = nn.ModuleList()
        self.up_samples = nn.ModuleList()

        for level, mult in reversed(list(enumerate(channel_mult))):
            out_channels_level = model_channels * mult

            # 残差块（需要处理跳跃连接，所以输入通道数翻倍）
            for i in range(num_res_blocks + 1):
                block = ResBlock(
                    channels + (model_channels * mult if i == 0 else 0),
                    out_channels_level,
                    time_dim,
                    dropout
                )
                self.up_blocks.append(block)

                if current_resolution in attention_resolutions:
                    self.up_blocks.append(AttentionBlock(out_channels_level, num_heads))

                channels = out_channels_level

            # 上采样
            if level > 0:
                self.up_samples.append(
                    nn.ConvTranspose2d(channels, channels, 4, stride=2, padding=1)
                )
                current_resolution *= 2

        # 输出层
        self.output = nn.Sequential(
            nn.GroupNorm(8, channels),
            nn.SiLU(),
            nn.Conv2d(channels, out_channels, 3, padding=1),
        )

    def forward(self, x, t):
        """
        前向传播
        Args:
            x: 输入图像 [B, C, H, W]
            t: 时间步 [B]
        Returns:
            预测的噪声 [B, C, H, W]
        """
        # 时间嵌入
        t_emb = self.time_embed(t)

        # 输入
        h = self.input_conv(x)

        # 保存跳跃连接
        skips = [h]

        # 下采样
        down_idx = 0
        for block in self.down_blocks:
            if isinstance(block, ResBlock):
                h = block(h, t_emb)
            else:  # AttentionBlock
                h = block(h)

            skips.append(h)

        for downsample in self.down_samples:
            h = downsample(h)
            skips.append(h)

        # 中间
        h = self.middle_block1(h, t_emb)
        h = self.middle_attn(h)
        h = self.middle_block2(h, t_emb)

        # 上采样
        for block in self.up_blocks:
            if isinstance(block, ResBlock):
                # 连接跳跃连接
                skip = skips.pop()
                h = torch.cat([h, skip], dim=1) if h.shape[2:] == skip.shape[2:] else h
                h = block(h, t_emb)
            else:  # AttentionBlock
                h = block(h)

        for upsample in self.up_samples:
            h = upsample(h)

        return self.output(h)
```

---

## 基于分数的生成模型

### 分数函数与扩散模型的联系

基于分数的生成模型（Score-Based Generative Models）提供了另一个理解扩散模型的视角。分数函数定义为对数概率密度的梯度：

$$\mathbf{s}(\mathbf{x}) = \nabla_{\mathbf{x}} \log p(\mathbf{x})$$

**关键洞察**：预测噪声等价于估计分数函数！

$$\boldsymbol{\epsilon}_\theta(\mathbf{x}_t, t) \approx -\sqrt{1-\bar{\alpha}_t} \cdot \nabla_{\mathbf{x}_t} \log q(\mathbf{x}_t)$$

### 分数匹配目标

分数匹配的训练目标是：

$$\mathcal{L}_{\text{SM}} = \mathbb{E}_{p(\mathbf{x})} \left[ \| \mathbf{s}_\theta(\mathbf{x}) - \nabla_{\mathbf{x}} \log p(\mathbf{x}) \|^2 \right]$$

由于真实分数未知，使用去噪分数匹配：

$$\mathcal{L}_{\text{DSM}} = \mathbb{E}_{q(\tilde{\mathbf{x}}|\mathbf{x})p(\mathbf{x})} \left[ \| \mathbf{s}_\theta(\tilde{\mathbf{x}}) - \nabla_{\tilde{\mathbf{x}}} \log q(\tilde{\mathbf{x}}|\mathbf{x}) \|^2 \right]$$

```python
class ScoreBasedModel(nn.Module):
    """基于分数的扩散模型"""

    def __init__(self, backbone, sigma_min=0.01, sigma_max=50, num_scales=1000):
        super().__init__()
        self.backbone = backbone
        self.sigma_min = sigma_min
        self.sigma_max = sigma_max
        self.num_scales = num_scales

        # 预计算噪声水平
        self.sigmas = torch.exp(
            torch.linspace(np.log(sigma_max), np.log(sigma_min), num_scales)
        )

    def forward(self, x, sigma):
        """预测分数函数"""
        return self.backbone(x, sigma)

    def score_matching_loss(self, x_0, sigma_idx=None):
        """
        计算去噪分数匹配损失
        """
        if sigma_idx is None:
            sigma_idx = torch.randint(0, self.num_scales, (x_0.shape[0],), device=x_0.device)

        sigma = self.sigmas[sigma_idx].view(-1, 1, 1, 1).to(x_0.device)

        # 添加噪声
        noise = torch.randn_like(x_0)
        x_noisy = x_0 + sigma * noise

        # 预测分数
        predicted_score = self.forward(x_noisy, sigma.squeeze())

        # 真实分数是 -noise / sigma
        target_score = -noise / sigma

        # 加权损失（使用sigma^2加权）
        loss = (sigma ** 2) * ((predicted_score - target_score) ** 2)

        return loss.mean()


class LangevinDynamicsSampler:
    """朗之万动力学采样器"""

    def __init__(self, model, device='cuda'):
        self.model = model
        self.device = device

    @torch.no_grad()
    def sample(self, shape, num_steps_per_scale=100, step_size=1e-5):
        """
        使用退火朗之万动力学采样
        """
        x = torch.randn(shape, device=self.device) * self.model.sigma_max

        for i, sigma in enumerate(self.model.sigmas):
            # 当前噪声水平
            sigma_batch = torch.full((shape[0],), sigma, device=self.device)

            # 自适应步长
            alpha = step_size * (sigma / self.model.sigma_min) ** 2

            for _ in range(num_steps_per_scale):
                # 计算分数
                score = self.model(x, sigma_batch)

                # 朗之万动力学更新
                noise = torch.randn_like(x)
                x = x + alpha * score + np.sqrt(2 * alpha) * noise

            if i % 100 == 0:
                print(f"Sigma {i}/{len(self.model.sigmas)}: {sigma:.4f}")

        return x
```

### SDE视角

Song等人在"Score-Based Generative Modeling through SDEs"中提出了统一的SDE框架：

**前向SDE**：
$$d\mathbf{x} = \mathbf{f}(\mathbf{x}, t)dt + g(t)d\mathbf{w}$$

**逆向SDE**：
$$d\mathbf{x} = [\mathbf{f}(\mathbf{x}, t) - g(t)^2 \nabla_{\mathbf{x}} \log p_t(\mathbf{x})]dt + g(t)d\bar{\mathbf{w}}$$

常见的SDE形式：

| SDE类型 | 前向过程 | 特点 |
|--------|---------|------|
| VP-SDE | $d\mathbf{x} = -\frac{1}{2}\beta(t)\mathbf{x}dt + \sqrt{\beta(t)}d\mathbf{w}$ | 方差保持 |
| VE-SDE | $d\mathbf{x} = \sqrt{\frac{d[\sigma^2(t)]}{dt}}d\mathbf{w}$ | 方差爆炸 |
| Sub-VP | 混合形式 | 采样效率更高 |

---

## 条件生成

### 条件扩散模型

条件生成是扩散模型的重要应用，允许根据文本、类别、图像等条件生成特定内容。

$$p_\theta(\mathbf{x}_{0:T}|\mathbf{c}) = p(\mathbf{x}_T) \prod_{t=1}^{T} p_\theta(\mathbf{x}_{t-1}|\mathbf{x}_t, \mathbf{c})$$

```python
class ConditionalUNet(nn.Module):
    """带条件的UNet"""

    def __init__(
        self,
        in_channels=3,
        out_channels=3,
        model_channels=128,
        num_classes=None,  # 类别条件
        context_dim=None,  # 文本/CLIP嵌入维度
    ):
        super().__init__()

        time_dim = model_channels * 4

        # 时间嵌入
        self.time_embed = nn.Sequential(
            SinusoidalPositionEmbeddings(model_channels),
            nn.Linear(model_channels, time_dim),
            nn.SiLU(),
            nn.Linear(time_dim, time_dim),
        )

        # 类别嵌入（可选）
        if num_classes is not None:
            self.class_embed = nn.Embedding(num_classes, time_dim)
        else:
            self.class_embed = None

        # 上下文投影（用于文本条件）
        if context_dim is not None:
            self.context_proj = nn.Linear(context_dim, time_dim)
        else:
            self.context_proj = None

        # ... 其余UNet结构 ...

    def forward(self, x, t, class_labels=None, context=None):
        """
        条件前向传播
        Args:
            x: 噪声图像 [B, C, H, W]
            t: 时间步 [B]
            class_labels: 类别标签 [B]（可选）
            context: 上下文嵌入 [B, seq_len, context_dim]（可选）
        """
        # 时间嵌入
        t_emb = self.time_embed(t)

        # 添加类别条件
        if class_labels is not None and self.class_embed is not None:
            t_emb = t_emb + self.class_embed(class_labels)

        # 添加上下文条件
        if context is not None and self.context_proj is not None:
            # 对上下文取平均或使用注意力池化
            context_emb = self.context_proj(context.mean(dim=1))
            t_emb = t_emb + context_emb

        # 继续UNet前向传播 ...
        # (使用t_emb进行条件注入)
        pass


class CrossAttention(nn.Module):
    """交叉注意力模块，用于文本-图像交互"""

    def __init__(self, query_dim, context_dim=None, heads=8, dim_head=64, dropout=0.0):
        super().__init__()
        inner_dim = dim_head * heads
        context_dim = context_dim or query_dim

        self.heads = heads
        self.scale = dim_head ** -0.5

        self.to_q = nn.Linear(query_dim, inner_dim, bias=False)
        self.to_k = nn.Linear(context_dim, inner_dim, bias=False)
        self.to_v = nn.Linear(context_dim, inner_dim, bias=False)
        self.to_out = nn.Sequential(
            nn.Linear(inner_dim, query_dim),
            nn.Dropout(dropout)
        )

    def forward(self, x, context=None):
        """
        Args:
            x: 图像特征 [B, H*W, C]
            context: 文本嵌入 [B, seq_len, context_dim]
        """
        if context is None:
            context = x  # 自注意力

        b, n, _ = x.shape

        q = self.to_q(x)
        k = self.to_k(context)
        v = self.to_v(context)

        # 分头
        q = q.view(b, n, self.heads, -1).transpose(1, 2)
        k = k.view(b, -1, self.heads, -1).transpose(1, 2)
        v = v.view(b, -1, self.heads, -1).transpose(1, 2)

        # 注意力
        attn = torch.matmul(q, k.transpose(-2, -1)) * self.scale
        attn = attn.softmax(dim=-1)

        out = torch.matmul(attn, v)
        out = out.transpose(1, 2).reshape(b, n, -1)

        return self.to_out(out)
```

### 文本条件生成

对于文本到图像生成，需要将文本编码并注入到扩散模型中：

```python
from transformers import CLIPTextModel, CLIPTokenizer

class TextEncoder:
    """使用CLIP编码文本"""

    def __init__(self, model_name="openai/clip-vit-large-patch14"):
        self.tokenizer = CLIPTokenizer.from_pretrained(model_name)
        self.text_model = CLIPTextModel.from_pretrained(model_name)
        self.text_model.requires_grad_(False)

    @torch.no_grad()
    def encode(self, prompts, max_length=77):
        """
        编码文本提示
        Args:
            prompts: 文本列表
            max_length: 最大序列长度
        Returns:
            text_embeddings: [B, seq_len, hidden_dim]
        """
        # 分词
        tokens = self.tokenizer(
            prompts,
            padding="max_length",
            max_length=max_length,
            truncation=True,
            return_tensors="pt",
        )

        # 编码
        outputs = self.text_model(
            input_ids=tokens.input_ids,
            attention_mask=tokens.attention_mask,
        )

        return outputs.last_hidden_state


# 使用示例
text_encoder = TextEncoder()
prompts = ["a photo of a cat", "a painting of mountains at sunset"]
text_embeddings = text_encoder.encode(prompts)
print(f"文本嵌入形状: {text_embeddings.shape}")  # [2, 77, 768]
```

---

## 无分类器引导

### Classifier-Free Guidance

无分类器引导（Classifier-Free Guidance, CFG）是条件生成的关键技术，可以在不需要额外分类器的情况下提高生成质量和条件一致性。

**核心思想**：训练时随机丢弃条件信息，推理时结合条件和无条件预测：

$$\tilde{\boldsymbol{\epsilon}}_\theta(\mathbf{x}_t, t, \mathbf{c}) = \boldsymbol{\epsilon}_\theta(\mathbf{x}_t, t, \varnothing) + w \cdot (\boldsymbol{\epsilon}_\theta(\mathbf{x}_t, t, \mathbf{c}) - \boldsymbol{\epsilon}_\theta(\mathbf{x}_t, t, \varnothing))$$

其中 $w$ 是引导强度（guidance scale），$\varnothing$ 表示空条件。

```python
class ClassifierFreeGuidanceTrainer:
    """无分类器引导训练"""

    def __init__(self, model, schedule, optimizer, p_uncond=0.1):
        """
        Args:
            p_uncond: 无条件训练的概率（通常0.1-0.2）
        """
        self.model = model
        self.schedule = schedule
        self.optimizer = optimizer
        self.p_uncond = p_uncond

    def train_step(self, x_0, condition):
        """
        训练步骤，随机丢弃条件
        """
        batch_size = x_0.shape[0]

        # 随机决定哪些样本使用无条件训练
        uncond_mask = torch.rand(batch_size) < self.p_uncond

        # 创建条件（无条件样本使用空嵌入或特殊token）
        condition_for_training = condition.clone()
        if uncond_mask.any():
            # 对于无条件样本，使用空嵌入
            condition_for_training[uncond_mask] = torch.zeros_like(condition[uncond_mask])

        # 常规DDPM训练
        t = torch.randint(0, self.schedule.num_timesteps, (batch_size,))
        noise = torch.randn_like(x_0)
        x_t = self.schedule.add_noise(x_0, t, noise)

        predicted_noise = self.model(x_t, t, condition_for_training)
        loss = F.mse_loss(predicted_noise, noise)

        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()

        return loss.item()


class CFGSampler:
    """无分类器引导采样器"""

    def __init__(self, model, schedule, device='cuda'):
        self.model = model
        self.schedule = schedule
        self.device = device

    @torch.no_grad()
    def sample(self, shape, condition, guidance_scale=7.5, num_steps=50):
        """
        使用CFG采样
        Args:
            shape: 输出形状
            condition: 条件嵌入
            guidance_scale: 引导强度（越大条件影响越强）
            num_steps: 采样步数
        """
        # 创建无条件嵌入
        uncond = torch.zeros_like(condition)

        # 合并条件和无条件（批处理计算）
        condition_combined = torch.cat([uncond, condition], dim=0)

        # 从噪声开始
        x = torch.randn(shape, device=self.device)

        # 时间步采样（可以跳步加速）
        timesteps = torch.linspace(
            self.schedule.num_timesteps - 1, 0, num_steps, dtype=torch.long
        )

        for t in timesteps:
            t_batch = torch.full((shape[0],), t, device=self.device, dtype=torch.long)

            # 复制x用于同时计算条件和无条件
            x_combined = torch.cat([x, x], dim=0)
            t_combined = torch.cat([t_batch, t_batch], dim=0)

            # 预测噪声
            noise_pred_combined = self.model(x_combined, t_combined, condition_combined)
            noise_pred_uncond, noise_pred_cond = noise_pred_combined.chunk(2)

            # 应用引导
            noise_pred = noise_pred_uncond + guidance_scale * (noise_pred_cond - noise_pred_uncond)

            # 去噪步骤
            x = self._denoise_step(x, noise_pred, t)

        return x

    def _denoise_step(self, x, noise_pred, t):
        """单步去噪"""
        alpha = self.schedule.alphas[t]
        alpha_bar = self.schedule.alphas_cumprod[t]
        beta = self.schedule.betas[t]

        mean = (1 / torch.sqrt(alpha)) * (
            x - (beta / torch.sqrt(1 - alpha_bar)) * noise_pred
        )

        if t > 0:
            noise = torch.randn_like(x)
            sigma = torch.sqrt(self.schedule.posterior_variance[t])
            x = mean + sigma * noise
        else:
            x = mean

        return x
```

### 引导强度的影响

| 引导强度 (w) | 效果 |
|-------------|------|
| w = 1.0 | 无引导，等同于纯条件生成 |
| w = 3.0-5.0 | 适中引导，平衡多样性和一致性 |
| w = 7.5 | 默认值，较强的条件一致性 |
| w > 10 | 强引导，可能导致过饱和或伪影 |

```python
def compare_guidance_scales(sampler, condition, scales=[1.0, 3.0, 7.5, 15.0]):
    """比较不同引导强度的效果"""
    fig, axes = plt.subplots(1, len(scales), figsize=(4 * len(scales), 4))

    for i, scale in enumerate(scales):
        sample = sampler.sample((1, 3, 64, 64), condition, guidance_scale=scale)
        sample = (sample.clamp(-1, 1) + 1) / 2  # 归一化到[0,1]

        axes[i].imshow(sample[0].permute(1, 2, 0).cpu())
        axes[i].set_title(f'w = {scale}')
        axes[i].axis('off')

    plt.tight_layout()
    plt.savefig('guidance_comparison.png')
    plt.show()
```

---

## Stable Diffusion架构

### 整体架构

Stable Diffusion是目前最流行的开源扩散模型，由Stability AI发布。它采用潜在空间扩散的方法，大大降低了计算成本。

**三个核心组件**：

1. **VAE（变分自编码器）**：将图像压缩到潜在空间
2. **UNet**：在潜在空间进行去噪
3. **文本编码器**：将文本转换为嵌入向量

```
       文本提示                           输出图像
          |                                 ^
    +-------------+                 +-------------+
    | CLIP Text   |                 | VAE Decoder |
    |  Encoder    |                 |             |
    +------+------+                 +------+------+
           |                               ^
    +----------------------------------------------+
    |              UNet (去噪器)                    |
    |   随机噪声 -> 迭代去噪 -> 潜在表示             |
    +----------------------------------------------+
```

```python
class StableDiffusionPipeline:
    """简化版Stable Diffusion管线"""

    def __init__(self, vae, unet, text_encoder, tokenizer, scheduler):
        self.vae = vae
        self.unet = unet
        self.text_encoder = text_encoder
        self.tokenizer = tokenizer
        self.scheduler = scheduler
        self.vae_scale_factor = 8  # VAE下采样倍数

    @torch.no_grad()
    def __call__(
        self,
        prompt,
        negative_prompt="",
        height=512,
        width=512,
        num_inference_steps=50,
        guidance_scale=7.5,
        seed=None,
    ):
        """
        文本到图像生成
        """
        if seed is not None:
            torch.manual_seed(seed)

        device = self.unet.device
        batch_size = 1 if isinstance(prompt, str) else len(prompt)

        # 1. 编码文本
        text_embeddings = self._encode_prompt(prompt, negative_prompt)

        # 2. 准备潜在空间噪声
        latent_height = height // self.vae_scale_factor
        latent_width = width // self.vae_scale_factor
        latents = torch.randn(
            (batch_size, 4, latent_height, latent_width),
            device=device,
        )
        latents = latents * self.scheduler.init_noise_sigma

        # 3. 去噪循环
        self.scheduler.set_timesteps(num_inference_steps)

        for t in self.scheduler.timesteps:
            # 扩展用于CFG
            latent_model_input = torch.cat([latents] * 2)
            latent_model_input = self.scheduler.scale_model_input(latent_model_input, t)

            # 预测噪声
            noise_pred = self.unet(
                latent_model_input,
                t,
                encoder_hidden_states=text_embeddings,
            ).sample

            # CFG
            noise_pred_uncond, noise_pred_text = noise_pred.chunk(2)
            noise_pred = noise_pred_uncond + guidance_scale * (noise_pred_text - noise_pred_uncond)

            # 更新潜在表示
            latents = self.scheduler.step(noise_pred, t, latents).prev_sample

        # 4. 解码到像素空间
        latents = 1 / 0.18215 * latents  # 缩放因子
        image = self.vae.decode(latents).sample

        # 后处理
        image = (image / 2 + 0.5).clamp(0, 1)
        image = image.permute(0, 2, 3, 1).cpu().numpy()

        return image

    def _encode_prompt(self, prompt, negative_prompt):
        """编码正向和负向提示"""
        # 正向提示
        text_inputs = self.tokenizer(
            prompt,
            padding="max_length",
            max_length=77,
            truncation=True,
            return_tensors="pt",
        )
        text_embeddings = self.text_encoder(text_inputs.input_ids.to(self.unet.device))[0]

        # 负向提示
        uncond_inputs = self.tokenizer(
            negative_prompt,
            padding="max_length",
            max_length=77,
            truncation=True,
            return_tensors="pt",
        )
        uncond_embeddings = self.text_encoder(uncond_inputs.input_ids.to(self.unet.device))[0]

        # 合并
        text_embeddings = torch.cat([uncond_embeddings, text_embeddings])

        return text_embeddings
```

### 潜在空间扩散（Latent Diffusion）

潜在空间扩散的核心优势是计算效率。将512x512的图像压缩到64x64的潜在空间，计算量减少约64倍。

```python
class LatentDiffusion(nn.Module):
    """潜在空间扩散模型"""

    def __init__(self, vae, unet, schedule):
        super().__init__()
        self.vae = vae
        self.unet = unet
        self.schedule = schedule
        self.scale_factor = 0.18215  # SD使用的缩放因子

    @torch.no_grad()
    def encode(self, x):
        """图像编码到潜在空间"""
        # VAE编码
        latent = self.vae.encode(x).latent_dist.sample()
        # 缩放
        latent = latent * self.scale_factor
        return latent

    @torch.no_grad()
    def decode(self, z):
        """潜在表示解码到图像"""
        # 反缩放
        z = z / self.scale_factor
        # VAE解码
        image = self.vae.decode(z).sample
        return image

    def forward(self, x, t, condition=None):
        """
        训练前向传播（在潜在空间）
        """
        # 编码到潜在空间
        z = self.encode(x)

        # 添加噪声
        noise = torch.randn_like(z)
        z_noisy = self.schedule.add_noise(z, t, noise)

        # 预测噪声
        noise_pred = self.unet(z_noisy, t, condition)

        return noise_pred, noise


class VAE(nn.Module):
    """变分自编码器（简化版）"""

    def __init__(self, in_channels=3, latent_channels=4, hidden_dims=[64, 128, 256, 512]):
        super().__init__()

        # 编码器
        encoder_layers = []
        prev_dim = in_channels
        for dim in hidden_dims:
            encoder_layers.extend([
                nn.Conv2d(prev_dim, dim, 4, stride=2, padding=1),
                nn.BatchNorm2d(dim),
                nn.LeakyReLU(0.2),
            ])
            prev_dim = dim
        self.encoder = nn.Sequential(*encoder_layers)

        # 潜在空间投影（均值和方差）
        self.fc_mu = nn.Conv2d(hidden_dims[-1], latent_channels, 1)
        self.fc_var = nn.Conv2d(hidden_dims[-1], latent_channels, 1)

        # 解码器
        decoder_layers = []
        hidden_dims_reversed = hidden_dims[::-1]
        for i in range(len(hidden_dims_reversed) - 1):
            decoder_layers.extend([
                nn.ConvTranspose2d(hidden_dims_reversed[i], hidden_dims_reversed[i+1], 4, stride=2, padding=1),
                nn.BatchNorm2d(hidden_dims_reversed[i+1]),
                nn.LeakyReLU(0.2),
            ])
        decoder_layers.append(
            nn.ConvTranspose2d(hidden_dims_reversed[-1], in_channels, 4, stride=2, padding=1)
        )
        decoder_layers.append(nn.Tanh())
        self.decoder = nn.Sequential(*decoder_layers)

        # 解码器输入投影
        self.decoder_input = nn.Conv2d(latent_channels, hidden_dims[-1], 1)

    def encode(self, x):
        """编码图像"""
        h = self.encoder(x)
        mu = self.fc_mu(h)
        log_var = self.fc_var(h)
        return mu, log_var

    def reparameterize(self, mu, log_var):
        """重参数化技巧"""
        std = torch.exp(0.5 * log_var)
        eps = torch.randn_like(std)
        return mu + eps * std

    def decode(self, z):
        """解码潜在表示"""
        h = self.decoder_input(z)
        return self.decoder(h)

    def forward(self, x):
        mu, log_var = self.encode(x)
        z = self.reparameterize(mu, log_var)
        reconstruction = self.decode(z)
        return reconstruction, mu, log_var
```

### Stable Diffusion的UNet结构

SD的UNet包含自注意力和交叉注意力层：

```python
class SDUNetBlock(nn.Module):
    """Stable Diffusion UNet块"""

    def __init__(self, in_channels, out_channels, time_dim, context_dim=768, num_heads=8):
        super().__init__()

        # 残差卷积
        self.res_conv = ResBlock(in_channels, out_channels, time_dim)

        # 空间自注意力
        self.spatial_attn = SpatialTransformer(
            out_channels,
            num_heads=num_heads,
            context_dim=None,  # 自注意力
        )

        # 交叉注意力（文本条件）
        self.cross_attn = SpatialTransformer(
            out_channels,
            num_heads=num_heads,
            context_dim=context_dim,  # 交叉注意力
        )

    def forward(self, x, t_emb, context):
        """
        Args:
            x: 特征图 [B, C, H, W]
            t_emb: 时间嵌入 [B, time_dim]
            context: 文本嵌入 [B, seq_len, context_dim]
        """
        x = self.res_conv(x, t_emb)
        x = self.spatial_attn(x)
        x = self.cross_attn(x, context)
        return x


class SpatialTransformer(nn.Module):
    """空间Transformer块"""

    def __init__(self, channels, num_heads=8, context_dim=None):
        super().__init__()
        self.norm = nn.GroupNorm(32, channels)
        self.proj_in = nn.Conv2d(channels, channels, 1)

        # 自注意力或交叉注意力
        self.attention = CrossAttention(
            query_dim=channels,
            context_dim=context_dim,
            heads=num_heads,
        )

        self.proj_out = nn.Conv2d(channels, channels, 1)

    def forward(self, x, context=None):
        b, c, h, w = x.shape

        residual = x
        x = self.norm(x)
        x = self.proj_in(x)

        # 展平空间维度
        x = x.view(b, c, h * w).transpose(1, 2)  # [B, H*W, C]

        # 注意力
        x = self.attention(x, context)

        # 恢复形状
        x = x.transpose(1, 2).view(b, c, h, w)
        x = self.proj_out(x)

        return x + residual
```

---

## 实战应用

### 使用Diffusers库

Hugging Face的Diffusers库提供了最便捷的扩散模型使用方式：

```python
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler
import torch

# 加载模型
model_id = "stabilityai/stable-diffusion-2-1"
pipe = StableDiffusionPipeline.from_pretrained(
    model_id,
    torch_dtype=torch.float16,
)
pipe = pipe.to("cuda")

# 使用更快的调度器
pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)

# 生成图像
prompt = "a photo of an astronaut riding a horse on mars, detailed, 4k, realistic"
negative_prompt = "blurry, low quality, distorted"

image = pipe(
    prompt,
    negative_prompt=negative_prompt,
    num_inference_steps=25,
    guidance_scale=7.5,
).images[0]

image.save("astronaut.png")
```

### 图像到图像生成

```python
from diffusers import StableDiffusionImg2ImgPipeline
from PIL import Image

# 加载模型
pipe = StableDiffusionImg2ImgPipeline.from_pretrained(
    "stabilityai/stable-diffusion-2-1",
    torch_dtype=torch.float16,
)
pipe = pipe.to("cuda")

# 加载初始图像
init_image = Image.open("input.png").convert("RGB")
init_image = init_image.resize((512, 512))

# 生成
prompt = "a fantasy landscape with castles and dragons, digital art"
image = pipe(
    prompt=prompt,
    image=init_image,
    strength=0.75,  # 控制变化程度（0-1）
    guidance_scale=7.5,
).images[0]

image.save("fantasy_landscape.png")
```

### 图像修复（Inpainting）

```python
from diffusers import StableDiffusionInpaintPipeline
import numpy as np

# 加载模型
pipe = StableDiffusionInpaintPipeline.from_pretrained(
    "stabilityai/stable-diffusion-2-inpainting",
    torch_dtype=torch.float16,
)
pipe = pipe.to("cuda")

# 准备图像和遮罩
image = Image.open("image.png").convert("RGB").resize((512, 512))
mask = Image.open("mask.png").convert("RGB").resize((512, 512))

# 生成
prompt = "a cute cat sitting on a cushion"
result = pipe(
    prompt=prompt,
    image=image,
    mask_image=mask,
    guidance_scale=7.5,
).images[0]

result.save("inpainted.png")
```

### ControlNet条件生成

ControlNet允许使用边缘图、深度图等作为额外条件：

```python
from diffusers import StableDiffusionControlNetPipeline, ControlNetModel
from diffusers.utils import load_image
import cv2
import numpy as np

# 加载ControlNet模型（Canny边缘检测）
controlnet = ControlNetModel.from_pretrained(
    "lllyasviel/sd-controlnet-canny",
    torch_dtype=torch.float16
)

pipe = StableDiffusionControlNetPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5",
    controlnet=controlnet,
    torch_dtype=torch.float16,
)
pipe = pipe.to("cuda")

# 准备控制图像（Canny边缘）
image = load_image("input.png")
image = np.array(image)
low_threshold = 100
high_threshold = 200
canny_image = cv2.Canny(image, low_threshold, high_threshold)
canny_image = Image.fromarray(canny_image)

# 生成
prompt = "a beautiful anime character, detailed, high quality"
output = pipe(
    prompt,
    image=canny_image,
    num_inference_steps=20,
).images[0]

output.save("controlnet_output.png")
```

### LoRA微调

使用LoRA高效微调Stable Diffusion：

```python
from diffusers import StableDiffusionPipeline
from peft import LoraConfig, get_peft_model
import torch

# 配置LoRA
lora_config = LoraConfig(
    r=4,  # LoRA秩
    lora_alpha=32,
    target_modules=["to_k", "to_q", "to_v", "to_out.0"],
    lora_dropout=0.05,
)

# 加载模型
pipe = StableDiffusionPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5",
    torch_dtype=torch.float16,
)

# 应用LoRA
unet = get_peft_model(pipe.unet, lora_config)

# 训练循环
optimizer = torch.optim.AdamW(unet.parameters(), lr=1e-4)

for epoch in range(num_epochs):
    for batch in train_dataloader:
        images = batch["images"].to("cuda")
        prompts = batch["prompts"]

        # 编码文本
        text_embeddings = pipe.encode_prompt(prompts)

        # 添加噪声
        noise = torch.randn_like(images)
        timesteps = torch.randint(0, 1000, (images.shape[0],))
        noisy_images = scheduler.add_noise(images, noise, timesteps)

        # 预测噪声
        noise_pred = unet(noisy_images, timesteps, text_embeddings).sample

        # 损失
        loss = F.mse_loss(noise_pred, noise)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

# 保存LoRA权重
unet.save_pretrained("my_lora_weights")
```

---

## 进阶技术

### DDIM加速采样

DDIM（Denoising Diffusion Implicit Models）通过确定性采样大幅减少所需步数：

```python
class DDIMSampler:
    """DDIM采样器"""

    def __init__(self, model, schedule, device='cuda'):
        self.model = model
        self.schedule = schedule
        self.device = device

    @torch.no_grad()
    def sample(self, shape, num_steps=50, eta=0.0):
        """
        DDIM采样
        Args:
            shape: 输出形状
            num_steps: 采样步数（可以远小于训练步数）
            eta: 随机性控制（0=确定性，1=完全随机）
        """
        # 创建子采样时间步
        step_size = self.schedule.num_timesteps // num_steps
        timesteps = list(range(0, self.schedule.num_timesteps, step_size))[::-1]

        # 从噪声开始
        x = torch.randn(shape, device=self.device)

        for i, t in enumerate(timesteps):
            t_batch = torch.full((shape[0],), t, device=self.device, dtype=torch.long)

            # 预测噪声
            epsilon = self.model(x, t_batch)

            # 计算预测的x_0
            alpha_bar = self.schedule.alphas_cumprod[t]
            x_0_pred = (x - torch.sqrt(1 - alpha_bar) * epsilon) / torch.sqrt(alpha_bar)

            # 计算下一步
            if i < len(timesteps) - 1:
                t_next = timesteps[i + 1]
                alpha_bar_next = self.schedule.alphas_cumprod[t_next]

                # DDIM更新
                sigma = eta * torch.sqrt(
                    (1 - alpha_bar_next) / (1 - alpha_bar) * (1 - alpha_bar / alpha_bar_next)
                )

                # 确定性部分
                x = (
                    torch.sqrt(alpha_bar_next) * x_0_pred +
                    torch.sqrt(1 - alpha_bar_next - sigma**2) * epsilon
                )

                # 随机部分
                if eta > 0:
                    x = x + sigma * torch.randn_like(x)
            else:
                x = x_0_pred

        return x
```

### DPM-Solver高效采样

DPM-Solver系列是目前最快的采样器之一：

```python
from diffusers import DPMSolverMultistepScheduler

# 配置DPM-Solver
scheduler = DPMSolverMultistepScheduler(
    num_train_timesteps=1000,
    beta_start=0.00085,
    beta_end=0.012,
    beta_schedule="scaled_linear",
    algorithm_type="dpmsolver++",
    solver_order=2,
    prediction_type="epsilon",
)

# 通常只需20-25步即可生成高质量图像
scheduler.set_timesteps(25)
```

### 一致性模型（Consistency Models）

一致性模型可以实现单步生成：

```python
class ConsistencyModel(nn.Module):
    """一致性模型（简化版）"""

    def __init__(self, backbone, schedule):
        super().__init__()
        self.backbone = backbone
        self.schedule = schedule

    def consistency_function(self, x_t, t):
        """
        一致性函数：将任意噪声水平映射到数据空间
        """
        # 对于小t，直接返回（接近数据）
        # 对于大t，需要去噪

        c_skip, c_out, c_in, c_noise = self._get_scalings(t)

        model_output = self.backbone(c_in * x_t, c_noise)

        return c_skip * x_t + c_out * model_output

    def _get_scalings(self, t):
        """计算缩放系数"""
        sigma = self.schedule.sigmas[t]
        sigma_data = 0.5  # 数据标准差

        c_skip = sigma_data**2 / (sigma**2 + sigma_data**2)
        c_out = sigma * sigma_data / torch.sqrt(sigma**2 + sigma_data**2)
        c_in = 1 / torch.sqrt(sigma**2 + sigma_data**2)
        c_noise = sigma

        return c_skip, c_out, c_in, c_noise

    @torch.no_grad()
    def sample(self, shape, num_steps=1):
        """
        采样（可以单步生成）
        """
        x = torch.randn(shape) * self.schedule.sigmas[0]

        if num_steps == 1:
            # 单步生成
            t = torch.zeros(shape[0], dtype=torch.long)
            return self.consistency_function(x, t)
        else:
            # 多步细化
            timesteps = torch.linspace(len(self.schedule.sigmas)-1, 0, num_steps).long()
            for t in timesteps:
                t_batch = torch.full((shape[0],), t)
                x = self.consistency_function(x, t_batch)

                if t > 0:
                    # 添加适量噪声用于下一步
                    noise_level = self.schedule.sigmas[t-1]
                    x = x + noise_level * torch.randn_like(x)

            return x
```

### 视频扩散模型

扩展到视频生成：

```python
class VideoUNet3D(nn.Module):
    """3D UNet用于视频扩散"""

    def __init__(self, in_channels, out_channels, model_channels, num_frames):
        super().__init__()
        self.num_frames = num_frames

        # 3D卷积用于时空建模
        self.conv3d = nn.Conv3d(in_channels, model_channels, kernel_size=3, padding=1)

        # 时间注意力
        self.temporal_attention = TemporalAttention(model_channels)

        # 空间块（复用2D UNet结构）
        self.spatial_blocks = nn.ModuleList([
            SpatialBlock(model_channels) for _ in range(4)
        ])

    def forward(self, x, t, context=None):
        """
        Args:
            x: [B, T, C, H, W] 视频张量
            t: 时间步
            context: 条件嵌入
        """
        b, num_frames, c, h, w = x.shape

        # 3D卷积处理
        x = x.permute(0, 2, 1, 3, 4)  # [B, C, T, H, W]
        x = self.conv3d(x)

        # 时间注意力
        x = x.permute(0, 2, 1, 3, 4)  # [B, T, C, H, W]
        x = self.temporal_attention(x)

        # 空间处理（逐帧）
        x = x.view(b * num_frames, -1, h, w)
        for block in self.spatial_blocks:
            x = block(x, t.repeat_interleave(num_frames))
        x = x.view(b, num_frames, -1, h, w)

        return x


class TemporalAttention(nn.Module):
    """时间维度注意力"""

    def __init__(self, channels, num_heads=8):
        super().__init__()
        self.attention = nn.MultiheadAttention(channels, num_heads, batch_first=True)
        self.norm = nn.LayerNorm(channels)

    def forward(self, x):
        """
        Args:
            x: [B, T, C, H, W]
        """
        b, t, c, h, w = x.shape

        # 在每个空间位置应用时间注意力
        x = x.permute(0, 3, 4, 1, 2)  # [B, H, W, T, C]
        x = x.reshape(b * h * w, t, c)

        # 注意力
        x_norm = self.norm(x)
        attn_out, _ = self.attention(x_norm, x_norm, x_norm)
        x = x + attn_out

        # 恢复形状
        x = x.reshape(b, h, w, t, c)
        x = x.permute(0, 3, 4, 1, 2)  # [B, T, C, H, W]

        return x
```

---

## 面试要点

### 核心概念题

**Q1: 解释扩散模型的前向和逆向过程**

扩散模型包含两个过程：
- **前向过程**：逐步向数据添加高斯噪声，这是一个固定的马尔可夫过程。数学上，$q(\mathbf{x}_t|\mathbf{x}_{t-1}) = \mathcal{N}(\sqrt{1-\beta_t}\mathbf{x}_{t-1}, \beta_t\mathbf{I})$
- **逆向过程**：学习如何从噪声恢复数据。神经网络学习预测每一步添加的噪声，然后逆向去除

关键是可以直接从$\mathbf{x}_0$采样任意时刻的$\mathbf{x}_t$，使训练高效。

**Q2: 为什么预测噪声而不是直接预测原始数据？**

两种参数化数学上等价，但预测噪声有优势：
1. 噪声的分布是标准正态分布，更容易学习
2. 损失函数的方差更小，训练更稳定
3. 实验表明预测噪声的效果更好

**Q3: 什么是Classifier-Free Guidance？为什么它重要？**

CFG是一种在不使用额外分类器的情况下增强条件生成的技术：
- 训练时随机丢弃条件（概率约10%）
- 推理时结合条件和无条件预测：$\tilde{\epsilon} = \epsilon_{uncond} + w(\epsilon_{cond} - \epsilon_{uncond})$
- 参数$w$控制条件的强度，通常设为7.5

重要性：提高生成质量和条件一致性，是当前所有文本到图像模型的标配。

**Q4: Stable Diffusion如何实现高效生成？**

Stable Diffusion使用潜在空间扩散：
1. 使用VAE将图像压缩到低维潜在空间（如512x512压缩到64x64）
2. 在潜在空间进行扩散过程
3. 最后解码回像素空间

这样计算量减少约64倍，同时保持生成质量。

### 进阶问题

**Q5: 比较DDPM和DDIM的采样方法**

| 方面 | DDPM | DDIM |
|-----|------|------|
| 随机性 | 完全随机 | 可调（eta参数） |
| 采样步数 | 需要完整步数 | 可大幅减少 |
| 生成质量 | 基准 | 略有下降但很小 |
| 插值 | 困难 | 确定性允许插值 |

**Q6: 分数匹配和去噪扩散的关系是什么？**

两者在数学上等价！分数函数是对数概率密度的梯度：$\mathbf{s}(\mathbf{x}) = \nabla_{\mathbf{x}} \log p(\mathbf{x})$。可以证明：
$$\boldsymbol{\epsilon}_\theta(\mathbf{x}_t, t) \approx -\sqrt{1-\bar{\alpha}_t} \cdot \nabla_{\mathbf{x}_t} \log q(\mathbf{x}_t)$$

这种联系由Song等人的SDE框架统一。

**Q7: 如何提高扩散模型的采样速度？**

主要方法：
1. **减少采样步数**：DDIM、DPM-Solver等高阶求解器
2. **模型蒸馏**：将多步模型蒸馏为少步模型
3. **一致性模型**：直接训练单步生成
4. **潜在空间扩散**：在低维空间操作
5. **模型量化和优化**：FP16、TensorRT等

### 代码实现题

**Q8: 实现简单的扩散训练循环**

```python
def train_step(model, x_0, schedule, optimizer):
    """单步训练"""
    # 1. 采样时间步
    t = torch.randint(0, schedule.num_timesteps, (x_0.shape[0],))

    # 2. 采样噪声
    noise = torch.randn_like(x_0)

    # 3. 前向扩散
    x_t = schedule.add_noise(x_0, t, noise)

    # 4. 预测噪声
    noise_pred = model(x_t, t)

    # 5. 计算MSE损失
    loss = F.mse_loss(noise_pred, noise)

    # 6. 优化
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()

    return loss.item()
```

**Q9: 实现CFG采样**

```python
@torch.no_grad()
def cfg_sample(model, shape, condition, guidance_scale=7.5):
    """CFG采样"""
    uncond = torch.zeros_like(condition)

    x = torch.randn(shape)

    for t in reversed(range(num_timesteps)):
        # 同时预测条件和无条件噪声
        noise_uncond = model(x, t, uncond)
        noise_cond = model(x, t, condition)

        # 应用引导
        noise_pred = noise_uncond + guidance_scale * (noise_cond - noise_uncond)

        # 去噪步骤
        x = denoise_step(x, noise_pred, t)

    return x
```

### 系统设计题

**Q10: 设计一个文本到图像生成服务**

```
架构设计：

1. API层
   - RESTful API接收文本提示
   - 请求验证和限流
   - 异步任务队列

2. 处理层
   - 文本预处理和安全过滤
   - CLIP文本编码器
   - Stable Diffusion推理引擎

3. 基础设施
   - GPU集群（A100/H100）
   - 模型缓存（减少加载时间）
   - 结果缓存（相同prompt复用）
   - CDN分发生成的图像

4. 优化策略
   - 批处理请求
   - 模型量化（FP16/INT8）
   - 使用TensorRT优化
   - 渐进式生成（先低分辨率后高分辨率）

5. 监控
   - 生成质量评估
   - 延迟和吞吐量监控
   - 成本追踪
```

---

## 总结

扩散模型已经成为生成式AI的核心技术，本文涵盖了：

1. **基础理论**：扩散过程、噪声调度、变分推理
2. **核心算法**：DDPM训练、去噪采样、分数匹配
3. **条件生成**：CFG、交叉注意力、ControlNet
4. **工程实践**：Stable Diffusion架构、高效采样、微调技术

掌握这些知识，你将能够：
- 理解和使用主流扩散模型
- 针对特定任务微调模型
- 优化模型性能和生成质量
- 在面试中展示深入的技术理解

推荐继续学习：
- 视频扩散模型（Sora、Runway Gen）
- 3D生成（DreamFusion、Magic3D）
- 音频扩散（AudioLDM、MusicGen）
- 多模态扩散模型
