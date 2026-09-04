---
title: Diffusion Models
description: Learn diffusion model principles and image generation applications
track: ai
section: deep-learning
difficulty: advanced
tags:
  - diffusion models
  - Stable Diffusion
  - image generation
  - DALL-E
status: imported
origin: old/src/content/docs/ai/diffusion-models.en.md
divergence: 0.342
issues: []
legacy:
  category: AI
  subcategory: Deep Learning
  order: 17
  lastUpdated: 2026-01-07
---

Diffusion models have emerged as one of the most powerful generative modeling techniques, achieving state-of-the-art results in image generation, audio synthesis, and video generation. We'll cover the fundamental principles, mathematical foundations, and practical applications of diffusion models.

---

## Introduction to Diffusion Models

Diffusion models are a class of generative models that learn to generate data by reversing a gradual noising process. Unlike GANs (Generative Adversarial Networks) or VAEs (Variational Autoencoders), diffusion models work by:

1. **Forward Process**: Gradually adding noise to data until it becomes pure Gaussian noise
2. **Reverse Process**: Learning to denoise step-by-step, recovering the original data from noise

**Key Advantages:**

| Aspect | Diffusion Models | GANs | VAEs |
|--------|-----------------|------|------|
| Training Stability | Highly stable | Mode collapse issues | Stable |
| Sample Quality | State-of-the-art | High quality | Lower quality |
| Mode Coverage | Excellent | Can miss modes | Good |
| Sampling Speed | Slow (many steps) | Fast (single pass) | Fast |
| Likelihood | Tractable | Intractable | Lower bound |

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
from tqdm import tqdm

# Basic concept illustration
def diffusion_concept():
    """
    Illustrate the core idea of diffusion models:
    - Start with clean data x_0
    - Add noise progressively: x_0 -> x_1 -> ... -> x_T (pure noise)
    - Learn to reverse: x_T -> x_{T-1} -> ... -> x_0 (recovered data)
    """
    # Original image (simplified as a 1D signal)
    x_0 = torch.randn(1, 64)  # Clean data

    # Forward process: add noise
    T = 1000  # Total timesteps
    betas = torch.linspace(0.0001, 0.02, T)  # Noise schedule

    x_t = x_0.clone()
    for t in range(T):
        noise = torch.randn_like(x_t)
        x_t = torch.sqrt(1 - betas[t]) * x_t + torch.sqrt(betas[t]) * noise

    # At t=T, x_t is approximately standard Gaussian noise
    print(f"Mean: {x_t.mean():.4f}, Std: {x_t.std():.4f}")
```

---

## The Diffusion Process

The forward diffusion process gradually corrupts data by adding Gaussian noise over T timesteps. This process is defined as a Markov chain.

### Mathematical Formulation

The forward process is defined as:

$$q(x_t | x_{t-1}) = \mathcal{N}(x_t; \sqrt{1-\beta_t} x_{t-1}, \beta_t \mathbf{I})$$

where $\beta_t$ is the noise schedule controlling how much noise is added at each step.

**Key Property - Closed Form Sampling:**

We can sample $x_t$ directly from $x_0$ without iterating through all steps:

$$q(x_t | x_0) = \mathcal{N}(x_t; \sqrt{\bar{\alpha}_t} x_0, (1-\bar{\alpha}_t) \mathbf{I})$$

where $\alpha_t = 1 - \beta_t$ and $\bar{\alpha}_t = \prod_{s=1}^{t} \alpha_s$.

This can be rewritten as:

$$x_t = \sqrt{\bar{\alpha}_t} x_0 + \sqrt{1-\bar{\alpha}_t} \epsilon, \quad \epsilon \sim \mathcal{N}(0, \mathbf{I})$$

```python
class DiffusionProcess:
    """Implementation of the forward diffusion process."""

    def __init__(self, num_timesteps=1000, beta_start=0.0001, beta_end=0.02):
        self.num_timesteps = num_timesteps

        # Define beta schedule (linear schedule)
        self.betas = torch.linspace(beta_start, beta_end, num_timesteps)

        # Pre-compute useful quantities
        self.alphas = 1.0 - self.betas
        self.alphas_cumprod = torch.cumprod(self.alphas, dim=0)
        self.alphas_cumprod_prev = F.pad(self.alphas_cumprod[:-1], (1, 0), value=1.0)

        # Calculations for diffusion q(x_t | x_0)
        self.sqrt_alphas_cumprod = torch.sqrt(self.alphas_cumprod)
        self.sqrt_one_minus_alphas_cumprod = torch.sqrt(1.0 - self.alphas_cumprod)

    def q_sample(self, x_0, t, noise=None):
        """
        Sample from q(x_t | x_0) using the closed-form formula.

        Args:
            x_0: Original clean data [B, C, H, W]
            t: Timestep indices [B]
            noise: Optional pre-generated noise

        Returns:
            x_t: Noised data at timestep t
        """
        if noise is None:
            noise = torch.randn_like(x_0)

        # Get the appropriate alpha values for each sample in batch
        sqrt_alpha_cumprod = self.sqrt_alphas_cumprod[t]
        sqrt_one_minus_alpha_cumprod = self.sqrt_one_minus_alphas_cumprod[t]

        # Reshape for broadcasting: [B] -> [B, 1, 1, 1]
        while len(sqrt_alpha_cumprod.shape) < len(x_0.shape):
            sqrt_alpha_cumprod = sqrt_alpha_cumprod.unsqueeze(-1)
            sqrt_one_minus_alpha_cumprod = sqrt_one_minus_alpha_cumprod.unsqueeze(-1)

        # Apply the forward diffusion formula
        x_t = sqrt_alpha_cumprod * x_0 + sqrt_one_minus_alpha_cumprod * noise

        return x_t

    def get_noise_schedule(self, schedule_type='linear'):
        """
        Different noise schedules affect generation quality.

        - Linear: Simple, works well for many cases
        - Cosine: Better for high-resolution images
        - Sigmoid: Smooth transition
        """
        if schedule_type == 'linear':
            return self.betas

        elif schedule_type == 'cosine':
            # Cosine schedule from "Improved DDPM" paper
            steps = self.num_timesteps + 1
            s = 0.008  # Small offset to prevent beta from being too small
            t = torch.linspace(0, self.num_timesteps, steps)
            alphas_cumprod = torch.cos((t / self.num_timesteps + s) / (1 + s) * np.pi / 2) ** 2
            alphas_cumprod = alphas_cumprod / alphas_cumprod[0]
            betas = 1 - (alphas_cumprod[1:] / alphas_cumprod[:-1])
            return torch.clamp(betas, 0.0001, 0.999)

        elif schedule_type == 'sigmoid':
            betas = torch.sigmoid(torch.linspace(-6, 6, self.num_timesteps))
            return betas * (self.betas[-1] - self.betas[0]) + self.betas[0]

# Example usage
diffusion = DiffusionProcess(num_timesteps=1000)

# Simulate forward process
x_0 = torch.randn(4, 3, 64, 64)  # Batch of 4 images
t = torch.tensor([0, 250, 500, 999])  # Different timesteps

x_t = diffusion.q_sample(x_0, t)
print(f"Original shape: {x_0.shape}, Noised shape: {x_t.shape}")
```

---

## Denoising and the Reverse Process

The reverse process learns to denoise data, transforming noise back into samples from the data distribution.

### Reverse Process Definition

The reverse process is also a Markov chain:

$$p_\theta(x_{t-1} | x_t) = \mathcal{N}(x_{t-1}; \mu_\theta(x_t, t), \Sigma_\theta(x_t, t))$$

where $\mu_\theta$ and $\Sigma_\theta$ are learned by a neural network.

### Parameterization Choices

There are several ways to parameterize what the network predicts:

1. **Predict $\epsilon$**: The noise that was added (most common)
2. **Predict $x_0$**: The original clean data directly
3. **Predict $v$**: A combination called "velocity" parameterization

```python
class DenoisingNetwork(nn.Module):
    """
    A simplified denoising network that predicts the noise.

    In practice, this would be a U-Net architecture with:
    - Time embedding
    - Residual blocks
    - Self-attention layers
    - Skip connections
    """

    def __init__(self, in_channels=3, hidden_channels=64, time_embed_dim=256):
        super().__init__()

        # Time embedding MLP
        self.time_mlp = nn.Sequential(
            SinusoidalPositionEmbedding(time_embed_dim),
            nn.Linear(time_embed_dim, time_embed_dim),
            nn.GELU(),
            nn.Linear(time_embed_dim, time_embed_dim)
        )

        # Simplified encoder-decoder (in practice, use full U-Net)
        self.encoder = nn.Sequential(
            nn.Conv2d(in_channels, hidden_channels, 3, padding=1),
            nn.GroupNorm(8, hidden_channels),
            nn.GELU(),
            nn.Conv2d(hidden_channels, hidden_channels * 2, 3, stride=2, padding=1),
            nn.GroupNorm(8, hidden_channels * 2),
            nn.GELU(),
        )

        self.middle = nn.Sequential(
            nn.Conv2d(hidden_channels * 2, hidden_channels * 2, 3, padding=1),
            nn.GroupNorm(8, hidden_channels * 2),
            nn.GELU(),
        )

        self.decoder = nn.Sequential(
            nn.ConvTranspose2d(hidden_channels * 2, hidden_channels, 4, stride=2, padding=1),
            nn.GroupNorm(8, hidden_channels),
            nn.GELU(),
            nn.Conv2d(hidden_channels, in_channels, 3, padding=1),
        )

        # Time conditioning
        self.time_proj = nn.Linear(time_embed_dim, hidden_channels * 2)

    def forward(self, x, t):
        """
        Predict the noise added to x at timestep t.

        Args:
            x: Noisy input [B, C, H, W]
            t: Timestep [B]

        Returns:
            Predicted noise [B, C, H, W]
        """
        # Get time embedding
        time_emb = self.time_mlp(t)

        # Encode
        h = self.encoder(x)

        # Add time conditioning
        time_proj = self.time_proj(time_emb)[:, :, None, None]
        h = h + time_proj

        # Middle
        h = self.middle(h)

        # Decode
        output = self.decoder(h)

        return output


class SinusoidalPositionEmbedding(nn.Module):
    """Sinusoidal position embedding for timesteps."""

    def __init__(self, dim):
        super().__init__()
        self.dim = dim

    def forward(self, t):
        device = t.device
        half_dim = self.dim // 2
        emb = np.log(10000) / (half_dim - 1)
        emb = torch.exp(torch.arange(half_dim, device=device) * -emb)
        emb = t[:, None] * emb[None, :]
        emb = torch.cat([torch.sin(emb), torch.cos(emb)], dim=-1)
        return emb
```

---

## DDPM: Denoising Diffusion Probabilistic Models

DDPM (Denoising Diffusion Probabilistic Models) is the foundational paper that popularized diffusion models for image generation.

### Training Objective

The training objective is to minimize the variational lower bound, which simplifies to:

$$L_{simple} = \mathbb{E}_{t, x_0, \epsilon} \left[ \| \epsilon - \epsilon_\theta(x_t, t) \|^2 \right]$$

This is simply the MSE between the actual noise added and the predicted noise.

### Sampling Algorithm

To generate new samples, we start from pure noise and iteratively denoise:

$$x_{t-1} = \frac{1}{\sqrt{\alpha_t}} \left( x_t - \frac{\beta_t}{\sqrt{1-\bar{\alpha}_t}} \epsilon_\theta(x_t, t) \right) + \sigma_t z$$

where $z \sim \mathcal{N}(0, \mathbf{I})$ and $\sigma_t$ is the noise variance.

```python
class DDPM:
    """Complete DDPM implementation for training and sampling."""

    def __init__(self, model, num_timesteps=1000, beta_start=0.0001, beta_end=0.02):
        self.model = model
        self.num_timesteps = num_timesteps

        # Noise schedule
        self.betas = torch.linspace(beta_start, beta_end, num_timesteps)
        self.alphas = 1.0 - self.betas
        self.alphas_cumprod = torch.cumprod(self.alphas, dim=0)
        self.alphas_cumprod_prev = F.pad(self.alphas_cumprod[:-1], (1, 0), value=1.0)

        # Pre-compute values for training
        self.sqrt_alphas_cumprod = torch.sqrt(self.alphas_cumprod)
        self.sqrt_one_minus_alphas_cumprod = torch.sqrt(1.0 - self.alphas_cumprod)

        # Pre-compute values for sampling
        self.sqrt_recip_alphas = torch.sqrt(1.0 / self.alphas)
        self.posterior_variance = (
            self.betas * (1.0 - self.alphas_cumprod_prev) / (1.0 - self.alphas_cumprod)
        )

    def _extract(self, a, t, x_shape):
        """Extract values from a at indices t and reshape for broadcasting."""
        batch_size = t.shape[0]
        out = a.gather(-1, t)
        return out.reshape(batch_size, *((1,) * (len(x_shape) - 1)))

    def q_sample(self, x_0, t, noise=None):
        """Forward diffusion: add noise to x_0."""
        if noise is None:
            noise = torch.randn_like(x_0)

        sqrt_alpha_cumprod = self._extract(self.sqrt_alphas_cumprod, t, x_0.shape)
        sqrt_one_minus_alpha_cumprod = self._extract(
            self.sqrt_one_minus_alphas_cumprod, t, x_0.shape
        )

        return sqrt_alpha_cumprod * x_0 + sqrt_one_minus_alpha_cumprod * noise

    def compute_loss(self, x_0):
        """
        Compute the training loss.

        Args:
            x_0: Clean images [B, C, H, W]

        Returns:
            loss: MSE loss between predicted and actual noise
        """
        batch_size = x_0.shape[0]
        device = x_0.device

        # Sample random timesteps
        t = torch.randint(0, self.num_timesteps, (batch_size,), device=device)

        # Sample noise
        noise = torch.randn_like(x_0)

        # Get noisy images
        x_t = self.q_sample(x_0, t, noise)

        # Predict noise
        predicted_noise = self.model(x_t, t)

        # Compute MSE loss
        loss = F.mse_loss(predicted_noise, noise)

        return loss

    @torch.no_grad()
    def p_sample(self, x_t, t):
        """
        Single step of reverse diffusion.

        Args:
            x_t: Current noisy sample
            t: Current timestep (scalar or batch)

        Returns:
            x_{t-1}: Slightly less noisy sample
        """
        # Handle scalar timestep
        if not isinstance(t, torch.Tensor):
            t = torch.full((x_t.shape[0],), t, device=x_t.device, dtype=torch.long)

        # Predict noise
        predicted_noise = self.model(x_t, t)

        # Get parameters for this timestep
        beta_t = self._extract(self.betas, t, x_t.shape)
        sqrt_one_minus_alpha_cumprod = self._extract(
            self.sqrt_one_minus_alphas_cumprod, t, x_t.shape
        )
        sqrt_recip_alpha = self._extract(self.sqrt_recip_alphas, t, x_t.shape)

        # Compute mean of p(x_{t-1} | x_t)
        model_mean = sqrt_recip_alpha * (
            x_t - beta_t * predicted_noise / sqrt_one_minus_alpha_cumprod
        )

        # Add noise (except at t=0)
        if t[0] > 0:
            posterior_variance = self._extract(self.posterior_variance, t, x_t.shape)
            noise = torch.randn_like(x_t)
            return model_mean + torch.sqrt(posterior_variance) * noise
        else:
            return model_mean

    @torch.no_grad()
    def sample(self, shape, device='cuda'):
        """
        Generate samples using the reverse diffusion process.

        Args:
            shape: Shape of samples to generate [B, C, H, W]
            device: Device to generate on

        Returns:
            Generated samples
        """
        # Start from pure noise
        x = torch.randn(shape, device=device)

        # Iteratively denoise
        for t in tqdm(reversed(range(self.num_timesteps)), desc='Sampling'):
            x = self.p_sample(x, t)

        return x


# Training loop example
def train_ddpm(model, dataloader, num_epochs=100, lr=2e-4, device='cuda'):
    """Train a DDPM model."""
    ddpm = DDPM(model)
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, num_epochs)

    model.to(device)
    ddpm.betas = ddpm.betas.to(device)
    ddpm.alphas_cumprod = ddpm.alphas_cumprod.to(device)
    ddpm.sqrt_alphas_cumprod = ddpm.sqrt_alphas_cumprod.to(device)
    ddpm.sqrt_one_minus_alphas_cumprod = ddpm.sqrt_one_minus_alphas_cumprod.to(device)
    ddpm.sqrt_recip_alphas = ddpm.sqrt_recip_alphas.to(device)
    ddpm.posterior_variance = ddpm.posterior_variance.to(device)

    for epoch in range(num_epochs):
        total_loss = 0
        for batch in dataloader:
            x_0 = batch[0].to(device)

            optimizer.zero_grad()
            loss = ddpm.compute_loss(x_0)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()

            total_loss += loss.item()

        scheduler.step()
        avg_loss = total_loss / len(dataloader)
        print(f'Epoch {epoch+1}/{num_epochs}, Loss: {avg_loss:.4f}')

    return ddpm
```

---

## Score-Based Models

Score-based models provide an alternative perspective on diffusion, focusing on learning the score function (gradient of log probability).

### Score Function

The score function is defined as:

$$\nabla_x \log p(x)$$

This tells us the direction to move to increase the probability of x.

### Score Matching

Instead of learning the score directly, we use denoising score matching:

$$\mathbb{E}_{x_0, x_t} \left[ \| s_\theta(x_t, t) - \nabla_{x_t} \log q(x_t | x_0) \|^2 \right]$$

The key insight is that:

$$\nabla_{x_t} \log q(x_t | x_0) = -\frac{x_t - \sqrt{\bar{\alpha}_t} x_0}{\sqrt{1 - \bar{\alpha}_t}} = -\frac{\epsilon}{\sqrt{1 - \bar{\alpha}_t}}$$

So predicting the noise is equivalent to estimating the score!

```python
class ScoreBasedModel:
    """
    Score-based generative model using Langevin dynamics.

    The connection to DDPM:
    - DDPM predicts noise epsilon
    - Score model predicts score = -epsilon / sqrt(1 - alpha_bar)
    - Both are mathematically equivalent
    """

    def __init__(self, model, num_scales=10, sigma_min=0.01, sigma_max=50):
        self.model = model
        self.num_scales = num_scales

        # Geometric noise schedule
        self.sigmas = torch.exp(
            torch.linspace(np.log(sigma_max), np.log(sigma_min), num_scales)
        )

    def score_loss(self, x_0, sigma_idx=None):
        """
        Denoising score matching loss.

        Args:
            x_0: Clean data
            sigma_idx: Optional specific noise level index

        Returns:
            Score matching loss
        """
        batch_size = x_0.shape[0]
        device = x_0.device

        # Sample noise level
        if sigma_idx is None:
            sigma_idx = torch.randint(0, self.num_scales, (batch_size,), device=device)

        sigma = self.sigmas[sigma_idx].view(-1, 1, 1, 1).to(device)

        # Add noise
        noise = torch.randn_like(x_0)
        x_noisy = x_0 + sigma * noise

        # Predict score
        # Note: We pass sigma/labels to the model for conditioning
        predicted_score = self.model(x_noisy, sigma_idx)

        # True score is -noise/sigma (from score matching derivation)
        target_score = -noise / sigma

        # Weighted loss (weight by sigma^2 for stability)
        loss = torch.mean(sigma ** 2 * (predicted_score - target_score) ** 2)

        return loss

    @torch.no_grad()
    def langevin_dynamics(self, x, sigma, n_steps=100, step_size=None):
        """
        Annealed Langevin dynamics sampling.

        Uses the score to iteratively refine samples:
        x_{i+1} = x_i + (step_size/2) * score(x_i) + sqrt(step_size) * z
        """
        if step_size is None:
            step_size = 2 * (sigma / self.sigmas[-1]) ** 2 * 0.00005

        for _ in range(n_steps):
            noise = torch.randn_like(x)
            score = self.model(x, sigma)
            x = x + step_size * score / 2 + torch.sqrt(step_size) * noise

        return x

    @torch.no_grad()
    def sample(self, shape, device='cuda', n_steps_per_sigma=100):
        """
        Generate samples using annealed Langevin dynamics.

        Start from high noise level and gradually refine.
        """
        # Start from noise
        x = torch.randn(shape, device=device) * self.sigmas[0]

        # Anneal through noise levels
        for i, sigma in enumerate(tqdm(self.sigmas, desc='Sampling')):
            sigma_tensor = torch.full((shape[0],), i, device=device, dtype=torch.long)
            x = self.langevin_dynamics(x, sigma_tensor, n_steps=n_steps_per_sigma)

        return x
```

### Connection Between DDPM and Score-Based Models

The two frameworks are deeply connected:

| Aspect | DDPM | Score-Based |
|--------|------|-------------|
| Predicts | Noise $\epsilon$ | Score $\nabla_x \log p$ |
| Relationship | $\epsilon_\theta$ | $s_\theta = -\epsilon_\theta / \sqrt{1-\bar{\alpha}_t}$ |
| Sampling | Ancestral sampling | Langevin dynamics |
| Perspective | Probabilistic | Energy-based |

---

## Conditioning Mechanisms

Conditional generation allows controlling the output based on class labels, text, or other signals.

### Class-Conditional Generation

For class-conditional generation, we condition the model on class labels:

$$p_\theta(x_{t-1} | x_t, y)$$

```python
class ConditionalUNet(nn.Module):
    """
    U-Net with class conditioning for conditional generation.
    """

    def __init__(self, in_channels=3, out_channels=3, num_classes=10,
                 base_channels=64, time_embed_dim=256, class_embed_dim=256):
        super().__init__()

        # Time embedding
        self.time_embed = nn.Sequential(
            SinusoidalPositionEmbedding(time_embed_dim),
            nn.Linear(time_embed_dim, time_embed_dim * 4),
            nn.GELU(),
            nn.Linear(time_embed_dim * 4, time_embed_dim)
        )

        # Class embedding
        self.class_embed = nn.Embedding(num_classes, class_embed_dim)

        # Combined conditioning
        self.cond_proj = nn.Linear(time_embed_dim + class_embed_dim, time_embed_dim)

        # U-Net architecture (simplified)
        self.encoder = nn.ModuleList([
            ConvBlock(in_channels, base_channels, time_embed_dim),
            ConvBlock(base_channels, base_channels * 2, time_embed_dim),
            ConvBlock(base_channels * 2, base_channels * 4, time_embed_dim),
        ])

        self.middle = ConvBlock(base_channels * 4, base_channels * 4, time_embed_dim)

        self.decoder = nn.ModuleList([
            ConvBlock(base_channels * 8, base_channels * 2, time_embed_dim),
            ConvBlock(base_channels * 4, base_channels, time_embed_dim),
            ConvBlock(base_channels * 2, base_channels, time_embed_dim),
        ])

        self.final = nn.Conv2d(base_channels, out_channels, 1)

    def forward(self, x, t, y):
        """
        Forward pass with time and class conditioning.

        Args:
            x: Noisy input [B, C, H, W]
            t: Timestep [B]
            y: Class labels [B]

        Returns:
            Predicted noise [B, C, H, W]
        """
        # Get embeddings
        time_emb = self.time_embed(t)
        class_emb = self.class_embed(y)

        # Combine conditions
        cond = self.cond_proj(torch.cat([time_emb, class_emb], dim=-1))

        # Encoder with skip connections
        skips = []
        h = x
        for block in self.encoder:
            h = block(h, cond)
            skips.append(h)
            h = F.avg_pool2d(h, 2)

        # Middle
        h = self.middle(h, cond)

        # Decoder
        for block in self.decoder:
            h = F.interpolate(h, scale_factor=2, mode='nearest')
            h = torch.cat([h, skips.pop()], dim=1)
            h = block(h, cond)

        return self.final(h)


class ConvBlock(nn.Module):
    """Convolutional block with time/condition embedding."""

    def __init__(self, in_channels, out_channels, emb_dim):
        super().__init__()
        self.conv1 = nn.Conv2d(in_channels, out_channels, 3, padding=1)
        self.conv2 = nn.Conv2d(out_channels, out_channels, 3, padding=1)
        self.norm1 = nn.GroupNorm(8, out_channels)
        self.norm2 = nn.GroupNorm(8, out_channels)
        self.emb_proj = nn.Linear(emb_dim, out_channels)

        if in_channels != out_channels:
            self.residual = nn.Conv2d(in_channels, out_channels, 1)
        else:
            self.residual = nn.Identity()

    def forward(self, x, emb):
        h = self.conv1(x)
        h = self.norm1(h)
        h = F.gelu(h)

        # Add conditioning
        emb_out = self.emb_proj(emb)[:, :, None, None]
        h = h + emb_out

        h = self.conv2(h)
        h = self.norm2(h)
        h = F.gelu(h)

        return h + self.residual(x)
```

### Text Conditioning

Text-to-image models use text encoders (like CLIP) to condition generation:

```python
class TextConditionedDiffusion(nn.Module):
    """
    Text-conditioned diffusion model using cross-attention.
    """

    def __init__(self, unet, text_encoder, tokenizer):
        super().__init__()
        self.unet = unet
        self.text_encoder = text_encoder  # e.g., CLIP text encoder
        self.tokenizer = tokenizer

    def encode_text(self, text_prompts):
        """Encode text prompts to embeddings."""
        # Tokenize
        tokens = self.tokenizer(
            text_prompts,
            padding='max_length',
            max_length=77,
            truncation=True,
            return_tensors='pt'
        )

        # Encode
        with torch.no_grad():
            text_embeddings = self.text_encoder(tokens.input_ids)[0]

        return text_embeddings

    def forward(self, x, t, text_prompts):
        """
        Forward pass with text conditioning.
        """
        # Get text embeddings
        text_emb = self.encode_text(text_prompts)

        # Pass through U-Net with cross-attention
        return self.unet(x, t, encoder_hidden_states=text_emb)


class CrossAttentionBlock(nn.Module):
    """Cross-attention for conditioning on text embeddings."""

    def __init__(self, query_dim, context_dim, num_heads=8):
        super().__init__()
        self.num_heads = num_heads
        self.head_dim = query_dim // num_heads

        self.to_q = nn.Linear(query_dim, query_dim)
        self.to_k = nn.Linear(context_dim, query_dim)
        self.to_v = nn.Linear(context_dim, query_dim)
        self.to_out = nn.Linear(query_dim, query_dim)

    def forward(self, x, context):
        """
        Args:
            x: Query features [B, L, D]
            context: Context (text) embeddings [B, S, C]
        """
        B, L, D = x.shape

        # Project to Q, K, V
        q = self.to_q(x)
        k = self.to_k(context)
        v = self.to_v(context)

        # Reshape for multi-head attention
        q = q.view(B, L, self.num_heads, self.head_dim).transpose(1, 2)
        k = k.view(B, -1, self.num_heads, self.head_dim).transpose(1, 2)
        v = v.view(B, -1, self.num_heads, self.head_dim).transpose(1, 2)

        # Attention
        attn = torch.matmul(q, k.transpose(-2, -1)) / (self.head_dim ** 0.5)
        attn = F.softmax(attn, dim=-1)
        out = torch.matmul(attn, v)

        # Reshape back
        out = out.transpose(1, 2).contiguous().view(B, L, D)

        return self.to_out(out)
```

---

## Classifier-Free Guidance

Classifier-free guidance is a technique to improve conditional generation quality by trading off diversity for fidelity.

### The Idea

Instead of using a separate classifier, we train a single model that can work both conditionally and unconditionally:

$$\tilde{\epsilon}_\theta(x_t, t, c) = \epsilon_\theta(x_t, t, \varnothing) + w \cdot (\epsilon_\theta(x_t, t, c) - \epsilon_\theta(x_t, t, \varnothing))$$

where:
- $c$ is the conditioning (text, class, etc.)
- $\varnothing$ represents the null/empty condition
- $w$ is the guidance scale (typically 7.5 for text-to-image)

### Training with Dropout

During training, we randomly drop the conditioning with some probability:

```python
class ClassifierFreeGuidance:
    """
    Classifier-free guidance implementation.

    Key insight: Train a single model that can operate both
    conditionally and unconditionally by randomly dropping
    the condition during training.
    """

    def __init__(self, model, null_token, dropout_prob=0.1):
        self.model = model
        self.null_token = null_token  # Embedding for "no condition"
        self.dropout_prob = dropout_prob

    def compute_loss(self, x_0, t, condition):
        """
        Training loss with random condition dropout.
        """
        batch_size = x_0.shape[0]
        device = x_0.device

        # Randomly drop conditions (replace with null token)
        drop_mask = torch.rand(batch_size, device=device) < self.dropout_prob
        condition_dropped = condition.clone()
        condition_dropped[drop_mask] = self.null_token

        # Add noise
        noise = torch.randn_like(x_0)
        x_t = self.q_sample(x_0, t, noise)

        # Predict noise
        predicted_noise = self.model(x_t, t, condition_dropped)

        # MSE loss
        loss = F.mse_loss(predicted_noise, noise)

        return loss

    @torch.no_grad()
    def guided_sample(self, x_t, t, condition, guidance_scale=7.5):
        """
        Sample with classifier-free guidance.

        Args:
            x_t: Current noisy sample
            t: Timestep
            condition: Conditioning signal
            guidance_scale: How much to amplify conditioning (w)

        Returns:
            Guided noise prediction
        """
        # Unconditional prediction
        null_condition = self.null_token.expand(x_t.shape[0], -1)
        eps_uncond = self.model(x_t, t, null_condition)

        # Conditional prediction
        eps_cond = self.model(x_t, t, condition)

        # Guided prediction: eps = eps_uncond + w * (eps_cond - eps_uncond)
        eps_guided = eps_uncond + guidance_scale * (eps_cond - eps_uncond)

        return eps_guided

    @torch.no_grad()
    def sample(self, shape, condition, guidance_scale=7.5, num_steps=50):
        """
        Generate samples using classifier-free guidance.
        """
        device = next(self.model.parameters()).device

        # Start from noise
        x = torch.randn(shape, device=device)

        # DDIM-style sampling for efficiency
        timesteps = torch.linspace(self.num_timesteps - 1, 0, num_steps).long()

        for t in tqdm(timesteps, desc='Sampling'):
            t_batch = t.expand(shape[0]).to(device)

            # Get guided noise prediction
            eps = self.guided_sample(x, t_batch, condition, guidance_scale)

            # DDIM update step
            x = self.ddim_step(x, eps, t)

        return x


# Practical example with different guidance scales
def demonstrate_guidance_scales():
    """
    Show the effect of different guidance scales:
    - w = 1.0: Normal conditional sampling
    - w = 7.5: Standard for text-to-image (good balance)
    - w = 15.0: Very strong conditioning (may oversaturate)
    """
    guidance_scales = [1.0, 3.0, 7.5, 15.0]

    for w in guidance_scales:
        print(f"\nGuidance scale w = {w}:")
        print(f"  - Low w (1.0): More diverse, may not match condition well")
        print(f"  - Medium w (7.5): Good balance of quality and diversity")
        print(f"  - High w (15+): Strong adherence to condition, less diversity")
```

---

## Stable Diffusion Architecture

Stable Diffusion is a latent diffusion model that operates in a compressed latent space for efficiency.

### Key Components

1. **VAE (Variational Autoencoder)**: Compresses images to latent space
2. **U-Net**: Denoises in latent space
3. **Text Encoder (CLIP)**: Encodes text prompts
4. **Scheduler**: Controls the sampling process

```python
class StableDiffusionPipeline:
    """
    Simplified Stable Diffusion pipeline.

    Architecture:
    1. Text -> CLIP Text Encoder -> Text Embeddings
    2. Noise -> U-Net (with text conditioning) -> Denoised Latents
    3. Denoised Latents -> VAE Decoder -> Image
    """

    def __init__(self, vae, unet, text_encoder, tokenizer, scheduler):
        self.vae = vae
        self.unet = unet
        self.text_encoder = text_encoder
        self.tokenizer = tokenizer
        self.scheduler = scheduler

        # VAE scaling factor (SD uses 0.18215)
        self.vae_scale_factor = 0.18215

    def encode_prompt(self, prompt, negative_prompt=""):
        """
        Encode text prompts to embeddings.

        Args:
            prompt: Text description of desired image
            negative_prompt: What to avoid in the image

        Returns:
            Concatenated embeddings for CFG
        """
        # Tokenize
        text_input = self.tokenizer(
            prompt,
            padding="max_length",
            max_length=77,
            truncation=True,
            return_tensors="pt"
        )

        # Encode
        text_embeddings = self.text_encoder(text_input.input_ids)[0]

        # For classifier-free guidance, also encode negative prompt
        uncond_input = self.tokenizer(
            negative_prompt,
            padding="max_length",
            max_length=77,
            return_tensors="pt"
        )
        uncond_embeddings = self.text_encoder(uncond_input.input_ids)[0]

        # Concatenate for batched CFG
        text_embeddings = torch.cat([uncond_embeddings, text_embeddings])

        return text_embeddings

    def encode_image(self, image):
        """Encode image to latent space using VAE."""
        latents = self.vae.encode(image).latent_dist.sample()
        latents = latents * self.vae_scale_factor
        return latents

    def decode_latents(self, latents):
        """Decode latents to image using VAE."""
        latents = latents / self.vae_scale_factor
        image = self.vae.decode(latents).sample
        return image

    @torch.no_grad()
    def __call__(
        self,
        prompt,
        negative_prompt="",
        height=512,
        width=512,
        num_inference_steps=50,
        guidance_scale=7.5,
        generator=None
    ):
        """
        Generate image from text prompt.

        Args:
            prompt: Text description
            negative_prompt: What to avoid
            height: Output image height
            width: Output image width
            num_inference_steps: Number of denoising steps
            guidance_scale: CFG scale
            generator: Random number generator for reproducibility

        Returns:
            Generated image
        """
        device = next(self.unet.parameters()).device

        # 1. Encode prompt
        text_embeddings = self.encode_prompt(prompt, negative_prompt)
        text_embeddings = text_embeddings.to(device)

        # 2. Prepare latent variables
        latent_height = height // 8  # VAE downsamples by 8
        latent_width = width // 8
        latents = torch.randn(
            (1, 4, latent_height, latent_width),
            generator=generator,
            device=device
        )

        # 3. Set up scheduler
        self.scheduler.set_timesteps(num_inference_steps)
        latents = latents * self.scheduler.init_noise_sigma

        # 4. Denoising loop
        for t in tqdm(self.scheduler.timesteps, desc="Generating"):
            # Expand latents for CFG (unconditional + conditional)
            latent_model_input = torch.cat([latents] * 2)
            latent_model_input = self.scheduler.scale_model_input(latent_model_input, t)

            # Predict noise
            noise_pred = self.unet(
                latent_model_input,
                t,
                encoder_hidden_states=text_embeddings
            ).sample

            # Classifier-free guidance
            noise_pred_uncond, noise_pred_cond = noise_pred.chunk(2)
            noise_pred = noise_pred_uncond + guidance_scale * (
                noise_pred_cond - noise_pred_uncond
            )

            # Compute previous noisy sample
            latents = self.scheduler.step(noise_pred, t, latents).prev_sample

        # 5. Decode latents
        image = self.decode_latents(latents)

        # 6. Post-process
        image = (image / 2 + 0.5).clamp(0, 1)

        return image


class LatentDiffusionUNet(nn.Module):
    """
    U-Net architecture for latent diffusion.

    Key features:
    - Operates on 4-channel latents (VAE encoded)
    - Cross-attention for text conditioning
    - Self-attention for global context
    - Residual connections throughout
    """

    def __init__(
        self,
        in_channels=4,
        out_channels=4,
        block_channels=(320, 640, 1280, 1280),
        attention_resolutions=(4, 2, 1),
        num_res_blocks=2,
        context_dim=768,  # CLIP embedding dimension
        num_heads=8
    ):
        super().__init__()

        self.in_channels = in_channels
        self.block_channels = block_channels

        # Time embedding
        time_embed_dim = block_channels[0] * 4
        self.time_embed = nn.Sequential(
            SinusoidalPositionEmbedding(block_channels[0]),
            nn.Linear(block_channels[0], time_embed_dim),
            nn.SiLU(),
            nn.Linear(time_embed_dim, time_embed_dim)
        )

        # Input projection
        self.input_conv = nn.Conv2d(in_channels, block_channels[0], 3, padding=1)

        # Downsampling blocks
        self.down_blocks = nn.ModuleList()
        in_ch = block_channels[0]
        for i, out_ch in enumerate(block_channels):
            for j in range(num_res_blocks):
                self.down_blocks.append(
                    ResnetBlock(in_ch if j == 0 else out_ch, out_ch, time_embed_dim)
                )
                if i in attention_resolutions:
                    self.down_blocks.append(
                        SpatialTransformer(out_ch, num_heads, out_ch // num_heads, context_dim)
                    )
                in_ch = out_ch
            if i < len(block_channels) - 1:
                self.down_blocks.append(Downsample(out_ch))

        # Middle blocks
        self.middle_block = nn.ModuleList([
            ResnetBlock(block_channels[-1], block_channels[-1], time_embed_dim),
            SpatialTransformer(block_channels[-1], num_heads, block_channels[-1] // num_heads, context_dim),
            ResnetBlock(block_channels[-1], block_channels[-1], time_embed_dim)
        ])

        # Upsampling blocks (mirror of down)
        self.up_blocks = nn.ModuleList()
        # ... similar structure with skip connections

        # Output
        self.out = nn.Sequential(
            nn.GroupNorm(32, block_channels[0]),
            nn.SiLU(),
            nn.Conv2d(block_channels[0], out_channels, 3, padding=1)
        )


class SpatialTransformer(nn.Module):
    """
    Transformer block for spatial features.
    Combines self-attention and cross-attention with text.
    """

    def __init__(self, channels, num_heads, head_dim, context_dim):
        super().__init__()

        self.norm = nn.GroupNorm(32, channels)

        inner_dim = num_heads * head_dim
        self.proj_in = nn.Conv2d(channels, inner_dim, 1)

        self.self_attn = CrossAttentionBlock(inner_dim, inner_dim, num_heads)
        self.cross_attn = CrossAttentionBlock(inner_dim, context_dim, num_heads)
        self.ff = FeedForward(inner_dim)

        self.proj_out = nn.Conv2d(inner_dim, channels, 1)

    def forward(self, x, context):
        B, C, H, W = x.shape

        residual = x
        x = self.norm(x)
        x = self.proj_in(x)

        # Reshape for attention: [B, C, H, W] -> [B, H*W, C]
        x = x.view(B, -1, H * W).transpose(1, 2)

        # Self-attention
        x = self.self_attn(x, x) + x

        # Cross-attention with text
        x = self.cross_attn(x, context) + x

        # Feed-forward
        x = self.ff(x) + x

        # Reshape back
        x = x.transpose(1, 2).view(B, -1, H, W)
        x = self.proj_out(x)

        return x + residual
```

---

## Practical Usage

### Using Hugging Face Diffusers

```python
from diffusers import StableDiffusionPipeline, DPMSolverMultistepScheduler
import torch

def generate_with_stable_diffusion():
    """Generate images using Stable Diffusion from Hugging Face."""

    # Load the pipeline
    model_id = "stabilityai/stable-diffusion-2-1"
    pipe = StableDiffusionPipeline.from_pretrained(
        model_id,
        torch_dtype=torch.float16
    )
    pipe = pipe.to("cuda")

    # Use efficient scheduler
    pipe.scheduler = DPMSolverMultistepScheduler.from_config(pipe.scheduler.config)

    # Generate image
    prompt = "A serene Japanese garden with cherry blossoms, " \
             "traditional wooden bridge over a koi pond, " \
             "soft morning light, highly detailed, artstation"

    negative_prompt = "blurry, low quality, distorted, ugly"

    image = pipe(
        prompt=prompt,
        negative_prompt=negative_prompt,
        num_inference_steps=25,  # DPM-Solver needs fewer steps
        guidance_scale=7.5,
        height=768,
        width=768
    ).images[0]

    image.save("generated_image.png")
    return image


def image_to_image():
    """Modify an existing image using Stable Diffusion."""
    from diffusers import StableDiffusionImg2ImgPipeline
    from PIL import Image

    pipe = StableDiffusionImg2ImgPipeline.from_pretrained(
        "stabilityai/stable-diffusion-2-1",
        torch_dtype=torch.float16
    ).to("cuda")

    # Load input image
    init_image = Image.open("input.png").convert("RGB")
    init_image = init_image.resize((512, 512))

    prompt = "A fantasy castle in the style of Studio Ghibli"

    image = pipe(
        prompt=prompt,
        image=init_image,
        strength=0.75,  # How much to change (0=none, 1=complete)
        guidance_scale=7.5
    ).images[0]

    return image


def inpainting():
    """Fill in masked regions of an image."""
    from diffusers import StableDiffusionInpaintPipeline
    from PIL import Image

    pipe = StableDiffusionInpaintPipeline.from_pretrained(
        "stabilityai/stable-diffusion-2-inpainting",
        torch_dtype=torch.float16
    ).to("cuda")

    image = Image.open("photo.png").convert("RGB")
    mask = Image.open("mask.png").convert("L")  # White = inpaint region

    prompt = "A fluffy orange cat sitting on the couch"

    result = pipe(
        prompt=prompt,
        image=image,
        mask_image=mask,
        guidance_scale=7.5
    ).images[0]

    return result
```

### ControlNet for Precise Control

```python
from diffusers import StableDiffusionControlNetPipeline, ControlNetModel
from diffusers.utils import load_image
import cv2
import numpy as np

def generate_with_controlnet():
    """
    Use ControlNet for precise structural control.

    ControlNet types:
    - Canny: Edge detection
    - Pose: Human pose
    - Depth: Depth maps
    - Scribble: Hand-drawn sketches
    - Segmentation: Semantic regions
    """

    # Load ControlNet (Canny edge version)
    controlnet = ControlNetModel.from_pretrained(
        "lllyasviel/sd-controlnet-canny",
        torch_dtype=torch.float16
    )

    pipe = StableDiffusionControlNetPipeline.from_pretrained(
        "runwayml/stable-diffusion-v1-5",
        controlnet=controlnet,
        torch_dtype=torch.float16
    ).to("cuda")

    # Prepare control image (Canny edges)
    image = load_image("input.png")
    image = np.array(image)
    edges = cv2.Canny(image, 100, 200)
    edges = np.stack([edges, edges, edges], axis=-1)
    control_image = Image.fromarray(edges)

    # Generate
    prompt = "A beautiful ancient temple, detailed architecture, " \
             "golden hour lighting, photorealistic"

    result = pipe(
        prompt=prompt,
        image=control_image,
        num_inference_steps=30
    ).images[0]

    return result
```

### SDXL (Stable Diffusion XL)

```python
from diffusers import StableDiffusionXLPipeline, AutoencoderKL
import torch

def generate_with_sdxl():
    """
    Generate high-quality images with SDXL.

    SDXL improvements:
    - 1024x1024 native resolution
    - Better text understanding
    - Improved image quality
    - Refiner model for detail enhancement
    """

    # Load VAE (fixes color issues)
    vae = AutoencoderKL.from_pretrained(
        "madebyollin/sdxl-vae-fp16-fix",
        torch_dtype=torch.float16
    )

    # Load base pipeline
    pipe = StableDiffusionXLPipeline.from_pretrained(
        "stabilityai/stable-diffusion-xl-base-1.0",
        vae=vae,
        torch_dtype=torch.float16,
        variant="fp16"
    ).to("cuda")

    # Enable memory optimizations
    pipe.enable_model_cpu_offload()
    pipe.enable_vae_slicing()

    prompt = "A majestic dragon perched on a mountain peak, " \
             "scales glistening in moonlight, epic fantasy art, " \
             "highly detailed, 8k resolution"

    negative_prompt = "low quality, blurry, distorted"

    image = pipe(
        prompt=prompt,
        negative_prompt=negative_prompt,
        num_inference_steps=40,
        guidance_scale=7.0,
        height=1024,
        width=1024
    ).images[0]

    return image


def sdxl_with_refiner():
    """Use SDXL with refiner for enhanced details."""
    from diffusers import StableDiffusionXLImg2ImgPipeline

    # Load base
    base = StableDiffusionXLPipeline.from_pretrained(
        "stabilityai/stable-diffusion-xl-base-1.0",
        torch_dtype=torch.float16
    ).to("cuda")

    # Load refiner
    refiner = StableDiffusionXLImg2ImgPipeline.from_pretrained(
        "stabilityai/stable-diffusion-xl-refiner-1.0",
        torch_dtype=torch.float16
    ).to("cuda")

    prompt = "Ultra detailed portrait of a warrior princess"

    # Base generation (run for 80% of steps)
    base_image = base(
        prompt=prompt,
        num_inference_steps=40,
        denoising_end=0.8,
        output_type="latent"
    ).images

    # Refiner (remaining 20% of denoising)
    refined_image = refiner(
        prompt=prompt,
        image=base_image,
        num_inference_steps=40,
        denoising_start=0.8
    ).images[0]

    return refined_image
```

### Training Your Own Diffusion Model

```python
from diffusers import DDPMScheduler, UNet2DModel
from diffusers.optimization import get_cosine_schedule_with_warmup
from accelerate import Accelerator
from torch.utils.data import DataLoader
from torchvision import transforms
from PIL import Image
import os

def train_diffusion_model(
    dataset,
    output_dir="./diffusion_model",
    num_epochs=100,
    batch_size=16,
    learning_rate=1e-4,
    image_size=128
):
    """
    Train a diffusion model from scratch.
    """

    # Data preprocessing
    transform = transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.RandomHorizontalFlip(),
        transforms.ToTensor(),
        transforms.Normalize([0.5], [0.5])  # Scale to [-1, 1]
    ])

    # Create dataloader
    dataloader = DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=4
    )

    # Initialize model
    model = UNet2DModel(
        sample_size=image_size,
        in_channels=3,
        out_channels=3,
        layers_per_block=2,
        block_out_channels=(128, 256, 512, 512),
        down_block_types=(
            "DownBlock2D",
            "DownBlock2D",
            "AttnDownBlock2D",
            "AttnDownBlock2D"
        ),
        up_block_types=(
            "AttnUpBlock2D",
            "AttnUpBlock2D",
            "UpBlock2D",
            "UpBlock2D"
        )
    )

    # Noise scheduler
    noise_scheduler = DDPMScheduler(
        num_train_timesteps=1000,
        beta_schedule="squaredcos_cap_v2"
    )

    # Optimizer
    optimizer = torch.optim.AdamW(model.parameters(), lr=learning_rate)

    # Learning rate scheduler
    lr_scheduler = get_cosine_schedule_with_warmup(
        optimizer=optimizer,
        num_warmup_steps=500,
        num_training_steps=len(dataloader) * num_epochs
    )

    # Accelerator for distributed training
    accelerator = Accelerator(
        mixed_precision="fp16",
        gradient_accumulation_steps=1
    )

    model, optimizer, dataloader, lr_scheduler = accelerator.prepare(
        model, optimizer, dataloader, lr_scheduler
    )

    # Training loop
    global_step = 0

    for epoch in range(num_epochs):
        model.train()
        progress_bar = tqdm(dataloader, desc=f"Epoch {epoch}")

        for batch in progress_bar:
            clean_images = batch["images"]

            # Sample noise
            noise = torch.randn_like(clean_images)

            # Sample timesteps
            timesteps = torch.randint(
                0, noise_scheduler.config.num_train_timesteps,
                (clean_images.shape[0],),
                device=clean_images.device
            ).long()

            # Add noise
            noisy_images = noise_scheduler.add_noise(clean_images, noise, timesteps)

            # Predict noise
            with accelerator.accumulate(model):
                noise_pred = model(noisy_images, timesteps).sample
                loss = F.mse_loss(noise_pred, noise)

                accelerator.backward(loss)
                accelerator.clip_grad_norm_(model.parameters(), 1.0)
                optimizer.step()
                lr_scheduler.step()
                optimizer.zero_grad()

            progress_bar.set_postfix({"loss": loss.item()})
            global_step += 1

        # Save checkpoint
        if (epoch + 1) % 10 == 0:
            accelerator.save_state(f"{output_dir}/checkpoint-{epoch}")

    # Save final model
    accelerator.save_model(model, output_dir)

    return model
```

---

## Interview Key Points

### Core Concepts

**Q1: Explain the forward and reverse diffusion processes.**

**Forward Process:**
- Gradually adds Gaussian noise to data over T timesteps
- Defined as: $q(x_t|x_{t-1}) = \mathcal{N}(x_t; \sqrt{1-\beta_t}x_{t-1}, \beta_t\mathbf{I})$
- Key property: Can sample any timestep directly using $x_t = \sqrt{\bar{\alpha}_t}x_0 + \sqrt{1-\bar{\alpha}_t}\epsilon$

**Reverse Process:**
- Learns to denoise by predicting the noise added
- Parameterized as: $p_\theta(x_{t-1}|x_t) = \mathcal{N}(x_{t-1}; \mu_\theta(x_t,t), \sigma_t^2\mathbf{I})$
- Training objective: MSE between predicted and actual noise

**Q2: What is classifier-free guidance and why is it important?**

Classifier-free guidance (CFG) improves conditional generation by:
1. Training with random condition dropout
2. During inference, interpolating between conditional and unconditional predictions:
   $\tilde{\epsilon} = \epsilon_{uncond} + w(\epsilon_{cond} - \epsilon_{uncond})$
3. Benefits: No separate classifier needed, better quality-diversity trade-off
4. Typical guidance scale: 7.5 for text-to-image

**Q3: Why does Stable Diffusion operate in latent space?**

Advantages of latent diffusion:
1. **Computational Efficiency**: Images (512x512x3) compressed to latents (64x64x4)
2. **Faster Training**: 4-16x speedup
3. **Better Features**: VAE learns perceptually meaningful representations
4. **Scalability**: Can train on larger batch sizes

Trade-off: Some fine detail may be lost in compression.

**Q4: Compare diffusion models with GANs and VAEs.**

| Aspect | Diffusion | GANs | VAEs |
|--------|-----------|------|------|
| Training | Stable, simple MSE | Adversarial, can be unstable | ELBO optimization |
| Quality | State-of-the-art | High, but mode collapse | Often blurry |
| Diversity | Excellent coverage | May miss modes | Good coverage |
| Speed | Slow (many steps) | Fast (single pass) | Fast |
| Controllability | Easy with CFG | Harder | Limited |

### Technical Details

**Q5: What are different noise schedules and their effects?**

```python
# Common schedules
schedules = {
    'linear': 'Simple, works for most cases',
    'cosine': 'Better for high-res, less info loss early',
    'sigmoid': 'Smooth transition, experimental',
    'scaled_linear': 'Used in Stable Diffusion'
}
```

**Q6: Explain DDIM sampling and its advantages.**

DDIM (Denoising Diffusion Implicit Models):
- Deterministic sampling (same seed = same result)
- Fewer steps needed (50 vs 1000)
- Allows interpolation in latent space
- Update rule skips timesteps without quality loss

**Q7: How does cross-attention work in text-to-image models?**

1. Text encoded by CLIP/T5 into sequence of embeddings
2. U-Net features serve as queries
3. Text embeddings serve as keys and values
4. Cross-attention: $\text{Attention}(Q_{image}, K_{text}, V_{text})$
5. Allows spatial features to attend to relevant text tokens

### Practical Considerations

**Q8: How to improve generation quality?**

1. **Prompt Engineering**: Be specific, use quality tokens ("highly detailed", "8k")
2. **Negative Prompts**: Exclude undesired features
3. **Guidance Scale**: Balance (7.5 typical, higher for more adherence)
4. **Steps**: More steps often better (diminishing returns after 50)
5. **Schedulers**: DPM-Solver, UniPC for fewer steps

**Q9: Common failure modes and solutions?**

| Problem | Cause | Solution |
|---------|-------|----------|
| Distorted faces | Training data issues | Use face restoration models |
| Wrong composition | Prompt ambiguity | Be more specific, use ControlNet |
| Artifacts | Low steps/guidance | Increase steps, adjust CFG |
| Style inconsistency | Mixed training data | Use LoRA for consistent style |

**Q10: How to fine-tune diffusion models efficiently?**

1. **LoRA**: Low-rank adaptation, trains ~1-4MB
2. **DreamBooth**: Full fine-tuning for specific subjects
3. **Textual Inversion**: Learn new token embeddings
4. **ControlNet**: Add control without retraining base

```python
# LoRA training example
from diffusers import StableDiffusionPipeline
from peft import LoraConfig, get_peft_model

lora_config = LoraConfig(
    r=4,  # Rank
    lora_alpha=32,
    target_modules=["to_q", "to_v", "to_k", "to_out.0"],
    lora_dropout=0.1
)

model = get_peft_model(unet, lora_config)
# Train only LoRA parameters (~0.1% of total)
```

---

## Further Reading

### Key Papers

1. **DDPM**: "Denoising Diffusion Probabilistic Models" (Ho et al., 2020)
2. **Score-Based**: "Score-Based Generative Modeling" (Song & Ermon, 2019)
3. **DDIM**: "Denoising Diffusion Implicit Models" (Song et al., 2020)
4. **Classifier-Free Guidance**: (Ho & Salimans, 2022)
5. **Latent Diffusion**: "High-Resolution Image Synthesis with Latent Diffusion Models" (Rombach et al., 2022)
6. **ControlNet**: "Adding Conditional Control to Text-to-Image Diffusion Models" (Zhang et al., 2023)

### Resources

- **Hugging Face Diffusers**: https://github.com/huggingface/diffusers
- **Stability AI**: https://stability.ai/
- **LAION**: Open datasets for training
- **Civitai**: Community models and LoRAs

### Advanced Topics

- Video diffusion models (Stable Video Diffusion, Sora)
- 3D generation (DreamFusion, Magic3D)
- Audio synthesis (AudioLDM)
- Multi-modal models (Unified diffusion)
- Efficient sampling (Consistency Models, LCM)

---

You should now understand:

1. The mathematical foundations of diffusion models
2. How DDPM and score-based models relate
3. Conditioning mechanisms including classifier-free guidance
4. The Stable Diffusion architecture
5. Practical usage with Hugging Face Diffusers
6. Key interview questions and their answers

Diffusion models represent a major breakthrough in generative AI, achieving unprecedented quality in image synthesis. As the field continues to evolve rapidly, staying current with new developments like consistency models, video generation, and multi-modal diffusion is essential for practitioners in this space.
