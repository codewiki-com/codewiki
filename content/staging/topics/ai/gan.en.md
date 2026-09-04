---
title: Generative Adversarial Networks (GAN)
description: Deep dive into GAN principles and applications
track: ai
section: deep-learning
difficulty: advanced
tags:
  - GAN
  - generative models
  - deep learning
  - image generation
status: imported
origin: old/src/content/docs/ai/gan.en.md
divergence: 0.148
issues: []
legacy:
  category: AI
  subcategory: Deep Learning
  order: 16
  lastUpdated: 2026-01-07
---

Generative Adversarial Networks, introduced by Ian Goodfellow and colleagues in 2014, represent one of the most exciting breakthroughs in deep learning. GANs have revolutionized the field of generative modeling, enabling the creation of remarkably realistic images, videos, and other data types. We'll explore GAN architecture, training dynamics, common challenges, popular variants, and practical implementations.

---

## Introduction to GANs

### What is a GAN?

A Generative Adversarial Network is a class of machine learning frameworks where two neural networks compete against each other in a game-theoretic scenario. The fundamental idea is elegant: one network (the Generator) tries to create fake data that looks real, while another network (the Discriminator) tries to distinguish between real and fake data.

This adversarial process drives both networks to improve continuously until the Generator produces data that is indistinguishable from real data.

### The Game Theory Perspective

GANs can be understood through the lens of game theory as a two-player minimax game:

$$\min_G \max_D V(D, G) = \mathbb{E}_{x \sim p_{data}(x)}[\log D(x)] + \mathbb{E}_{z \sim p_z(z)}[\log(1 - D(G(z)))]$$

Where:
- $G$ is the Generator
- $D$ is the Discriminator
- $x$ represents real data samples
- $z$ represents random noise (latent vector)
- $p_{data}$ is the real data distribution
- $p_z$ is the noise distribution (typically Gaussian or uniform)

The Discriminator tries to maximize this objective (correctly classify real vs. fake), while the Generator tries to minimize it (fool the Discriminator).

---

## GAN Architecture

### The Generator Network

The Generator takes a random noise vector $z$ from a latent space and transforms it into a data sample (e.g., an image). It learns to map from a simple distribution to the complex data distribution.

**Key characteristics:**
- Input: Random noise vector (typically 100-dimensional)
- Output: Generated data matching the target domain
- Architecture: Usually uses transposed convolutions (deconvolutions) for image generation
- Activation: ReLU or LeakyReLU in hidden layers, Tanh in the output layer

```python
import torch
import torch.nn as nn

class Generator(nn.Module):
    """Basic Generator Network for 64x64 images"""

    def __init__(self, latent_dim=100, channels=3, feature_maps=64):
        super().__init__()
        self.latent_dim = latent_dim

        self.main = nn.Sequential(
            # Input: latent_dim x 1 x 1
            nn.ConvTranspose2d(latent_dim, feature_maps * 8, 4, 1, 0, bias=False),
            nn.BatchNorm2d(feature_maps * 8),
            nn.ReLU(True),
            # State: (feature_maps*8) x 4 x 4

            nn.ConvTranspose2d(feature_maps * 8, feature_maps * 4, 4, 2, 1, bias=False),
            nn.BatchNorm2d(feature_maps * 4),
            nn.ReLU(True),
            # State: (feature_maps*4) x 8 x 8

            nn.ConvTranspose2d(feature_maps * 4, feature_maps * 2, 4, 2, 1, bias=False),
            nn.BatchNorm2d(feature_maps * 2),
            nn.ReLU(True),
            # State: (feature_maps*2) x 16 x 16

            nn.ConvTranspose2d(feature_maps * 2, feature_maps, 4, 2, 1, bias=False),
            nn.BatchNorm2d(feature_maps),
            nn.ReLU(True),
            # State: feature_maps x 32 x 32

            nn.ConvTranspose2d(feature_maps, channels, 4, 2, 1, bias=False),
            nn.Tanh()
            # Output: channels x 64 x 64
        )

    def forward(self, z):
        # Reshape noise to (batch, latent_dim, 1, 1)
        z = z.view(-1, self.latent_dim, 1, 1)
        return self.main(z)
```

### The Discriminator Network

The Discriminator is a binary classifier that takes a data sample (real or generated) and outputs the probability that it is real.

**Key characteristics:**
- Input: Data sample (e.g., image)
- Output: Probability score (0 = fake, 1 = real)
- Architecture: Usually uses strided convolutions for image classification
- Activation: LeakyReLU in hidden layers, Sigmoid in output layer

```python
class Discriminator(nn.Module):
    """Basic Discriminator Network for 64x64 images"""

    def __init__(self, channels=3, feature_maps=64):
        super().__init__()

        self.main = nn.Sequential(
            # Input: channels x 64 x 64
            nn.Conv2d(channels, feature_maps, 4, 2, 1, bias=False),
            nn.LeakyReLU(0.2, inplace=True),
            # State: feature_maps x 32 x 32

            nn.Conv2d(feature_maps, feature_maps * 2, 4, 2, 1, bias=False),
            nn.BatchNorm2d(feature_maps * 2),
            nn.LeakyReLU(0.2, inplace=True),
            # State: (feature_maps*2) x 16 x 16

            nn.Conv2d(feature_maps * 2, feature_maps * 4, 4, 2, 1, bias=False),
            nn.BatchNorm2d(feature_maps * 4),
            nn.LeakyReLU(0.2, inplace=True),
            # State: (feature_maps*4) x 8 x 8

            nn.Conv2d(feature_maps * 4, feature_maps * 8, 4, 2, 1, bias=False),
            nn.BatchNorm2d(feature_maps * 8),
            nn.LeakyReLU(0.2, inplace=True),
            # State: (feature_maps*8) x 4 x 4

            nn.Conv2d(feature_maps * 8, 1, 4, 1, 0, bias=False),
            nn.Sigmoid()
            # Output: 1 x 1 x 1
        )

    def forward(self, x):
        return self.main(x).view(-1, 1).squeeze(1)
```

### Architecture Diagram

```
                    GAN Architecture

    +---------+     +-----------+     +---------------+
    | Latent  | --> | Generator | --> | Generated     |
    | Noise z |     |    (G)    |     | Sample G(z)   |
    +---------+     +-----------+     +-------+-------+
                                              |
                                              v
                    +-------------+    +------+------+
                    | Real Data x | -> |             |
                    +-------------+    |Discriminator| --> Real/Fake
                                       |    (D)      |     Probability
                    +-------------+ -> |             |
                    | Fake Data   |    +-------------+
                    | G(z)        |
                    +-------------+
```

---

## Training Dynamics

### The Training Process

GAN training alternates between updating the Discriminator and the Generator:

1. **Discriminator Update:**
   - Sample a batch of real data
   - Sample random noise and generate fake data
   - Train Discriminator to classify real data as real and fake data as fake
   - Update Discriminator weights to maximize classification accuracy

2. **Generator Update:**
   - Sample random noise
   - Generate fake data
   - Train Generator to fool the Discriminator
   - Update Generator weights to maximize Discriminator's error on fake data

### Mathematical Formulation

**Discriminator Loss:**
$$L_D = -\mathbb{E}_{x \sim p_{data}}[\log D(x)] - \mathbb{E}_{z \sim p_z}[\log(1 - D(G(z)))]$$

**Generator Loss (Original):**
$$L_G = \mathbb{E}_{z \sim p_z}[\log(1 - D(G(z)))]$$

**Generator Loss (Non-saturating):**
$$L_G = -\mathbb{E}_{z \sim p_z}[\log D(G(z))]$$

The non-saturating loss is preferred in practice because it provides stronger gradients early in training when the Generator is poor.

### Training Code Example

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from tqdm import tqdm

def train_gan(generator, discriminator, dataloader, num_epochs=100,
              latent_dim=100, device='cuda', lr=0.0002, beta1=0.5):
    """
    Train a GAN using the standard adversarial training procedure.
    """
    # Loss function
    criterion = nn.BCELoss()

    # Optimizers
    optimizer_G = optim.Adam(generator.parameters(), lr=lr, betas=(beta1, 0.999))
    optimizer_D = optim.Adam(discriminator.parameters(), lr=lr, betas=(beta1, 0.999))

    # Labels for real and fake data
    real_label = 1.0
    fake_label = 0.0

    # Training history
    g_losses = []
    d_losses = []

    generator.to(device)
    discriminator.to(device)

    for epoch in range(num_epochs):
        epoch_g_loss = 0
        epoch_d_loss = 0

        pbar = tqdm(dataloader, desc=f'Epoch {epoch+1}/{num_epochs}')
        for batch_idx, (real_data, _) in enumerate(pbar):
            batch_size = real_data.size(0)
            real_data = real_data.to(device)

            # ===================
            # Train Discriminator
            # ===================
            discriminator.zero_grad()

            # Train with real data
            label = torch.full((batch_size,), real_label, device=device)
            output = discriminator(real_data)
            loss_real = criterion(output, label)
            loss_real.backward()
            D_x = output.mean().item()

            # Train with fake data
            noise = torch.randn(batch_size, latent_dim, device=device)
            fake_data = generator(noise)
            label.fill_(fake_label)
            output = discriminator(fake_data.detach())
            loss_fake = criterion(output, label)
            loss_fake.backward()
            D_G_z1 = output.mean().item()

            # Update Discriminator
            loss_D = loss_real + loss_fake
            optimizer_D.step()

            # ===============
            # Train Generator
            # ===============
            generator.zero_grad()

            label.fill_(real_label)  # Generator wants D to think fake is real
            output = discriminator(fake_data)
            loss_G = criterion(output, label)
            loss_G.backward()
            D_G_z2 = output.mean().item()

            # Update Generator
            optimizer_G.step()

            # Record losses
            epoch_g_loss += loss_G.item()
            epoch_d_loss += loss_D.item()

            # Update progress bar
            pbar.set_postfix({
                'D_loss': f'{loss_D.item():.4f}',
                'G_loss': f'{loss_G.item():.4f}',
                'D(x)': f'{D_x:.3f}',
                'D(G(z))': f'{D_G_z1:.3f}/{D_G_z2:.3f}'
            })

        # Record epoch losses
        g_losses.append(epoch_g_loss / len(dataloader))
        d_losses.append(epoch_d_loss / len(dataloader))

        print(f'Epoch [{epoch+1}/{num_epochs}] '
              f'D_loss: {d_losses[-1]:.4f} G_loss: {g_losses[-1]:.4f}')

    return g_losses, d_losses
```

---

## Loss Functions

### Standard GAN Loss (Minimax)

The original GAN uses binary cross-entropy loss:

```python
def vanilla_gan_loss(discriminator, real_data, fake_data, device='cuda'):
    """Original GAN loss using BCE"""
    criterion = nn.BCELoss()

    batch_size = real_data.size(0)
    real_labels = torch.ones(batch_size, device=device)
    fake_labels = torch.zeros(batch_size, device=device)

    # Discriminator loss
    d_real = discriminator(real_data)
    d_fake = discriminator(fake_data.detach())
    d_loss = criterion(d_real, real_labels) + criterion(d_fake, fake_labels)

    # Generator loss (non-saturating version)
    g_loss = criterion(discriminator(fake_data), real_labels)

    return d_loss, g_loss
```

### Wasserstein Loss (WGAN)

WGAN uses the Wasserstein distance (Earth Mover's distance) for more stable training:

$$L_D = \mathbb{E}_{x \sim p_{data}}[D(x)] - \mathbb{E}_{z \sim p_z}[D(G(z))]$$
$$L_G = -\mathbb{E}_{z \sim p_z}[D(G(z))]$$

```python
def wasserstein_loss(discriminator, real_data, fake_data):
    """Wasserstein GAN loss"""
    # Discriminator (Critic) loss
    d_real = discriminator(real_data).mean()
    d_fake = discriminator(fake_data.detach()).mean()
    d_loss = d_fake - d_real  # Minimize this (maximize d_real - d_fake)

    # Generator loss
    g_loss = -discriminator(fake_data).mean()

    return d_loss, g_loss


def gradient_penalty(discriminator, real_data, fake_data, device='cuda', lambda_gp=10):
    """Gradient penalty for WGAN-GP"""
    batch_size = real_data.size(0)

    # Random interpolation coefficient
    alpha = torch.rand(batch_size, 1, 1, 1, device=device)
    alpha = alpha.expand_as(real_data)

    # Interpolated samples
    interpolated = alpha * real_data + (1 - alpha) * fake_data
    interpolated.requires_grad_(True)

    # Discriminator output on interpolated samples
    d_interpolated = discriminator(interpolated)

    # Compute gradients
    gradients = torch.autograd.grad(
        outputs=d_interpolated,
        inputs=interpolated,
        grad_outputs=torch.ones_like(d_interpolated),
        create_graph=True,
        retain_graph=True
    )[0]

    # Compute gradient penalty
    gradients = gradients.view(batch_size, -1)
    gradient_norm = gradients.norm(2, dim=1)
    penalty = lambda_gp * ((gradient_norm - 1) ** 2).mean()

    return penalty
```

### Least Squares Loss (LSGAN)

LSGAN replaces the cross-entropy loss with least squares loss for more stable training:

```python
def lsgan_loss(discriminator, real_data, fake_data, device='cuda'):
    """Least Squares GAN loss"""
    # Target values
    real_target = 1.0
    fake_target = 0.0

    # Discriminator loss
    d_real = discriminator(real_data)
    d_fake = discriminator(fake_data.detach())
    d_loss = 0.5 * ((d_real - real_target) ** 2).mean() + \
             0.5 * ((d_fake - fake_target) ** 2).mean()

    # Generator loss
    g_loss = 0.5 * ((discriminator(fake_data) - real_target) ** 2).mean()

    return d_loss, g_loss
```

### Hinge Loss

Hinge loss is commonly used in modern GANs like BigGAN:

```python
def hinge_loss(discriminator, real_data, fake_data):
    """Hinge loss for GANs"""
    # Discriminator loss
    d_real = discriminator(real_data)
    d_fake = discriminator(fake_data.detach())
    d_loss = torch.relu(1.0 - d_real).mean() + torch.relu(1.0 + d_fake).mean()

    # Generator loss
    g_loss = -discriminator(fake_data).mean()

    return d_loss, g_loss
```

---

## Mode Collapse and Training Challenges

### What is Mode Collapse?

Mode collapse occurs when the Generator produces a limited variety of outputs, failing to capture the full diversity of the data distribution. Instead of learning to generate all types of samples, the Generator finds a few "safe" outputs that fool the Discriminator.

**Types of mode collapse:**
- **Complete collapse**: Generator produces identical outputs regardless of input noise
- **Partial collapse**: Generator produces outputs from only a subset of modes

### Causes of Mode Collapse

1. **Discriminator overwhelms Generator**: When the Discriminator becomes too strong, it provides little useful gradient signal
2. **Generator finds shortcuts**: The Generator learns to exploit specific weaknesses in the Discriminator
3. **Imbalanced training**: One network trains faster than the other

### Solutions to Mode Collapse

```python
class MinibatchDiscrimination(nn.Module):
    """Minibatch discrimination to encourage diversity"""

    def __init__(self, in_features, out_features, kernel_dims):
        super().__init__()
        self.T = nn.Parameter(torch.randn(in_features, out_features, kernel_dims))

    def forward(self, x):
        # x: (batch_size, in_features)
        # Compute feature matrices
        matrices = torch.mm(x, self.T.view(x.size(1), -1))
        matrices = matrices.view(-1, self.T.size(1), self.T.size(2))

        # Compute pairwise distances
        diff = matrices.unsqueeze(0) - matrices.unsqueeze(1)
        abs_diff = torch.abs(diff).sum(2)

        # Compute minibatch features
        exp_diff = torch.exp(-abs_diff)
        mb_features = exp_diff.sum(0) - 1  # Subtract self-comparison

        return torch.cat([x, mb_features], dim=1)


class UnrolledGAN:
    """Unrolled GAN training for stability"""

    def __init__(self, generator, discriminator, unroll_steps=5):
        self.generator = generator
        self.discriminator = discriminator
        self.unroll_steps = unroll_steps

    def train_step(self, real_data, noise, criterion, optimizer_G, optimizer_D, device):
        # Save discriminator state
        d_state = {k: v.clone() for k, v in self.discriminator.state_dict().items()}

        # Unroll discriminator updates
        for _ in range(self.unroll_steps):
            fake_data = self.generator(noise)
            d_loss = self._compute_d_loss(real_data, fake_data, criterion)
            optimizer_D.zero_grad()
            d_loss.backward(retain_graph=True)
            optimizer_D.step()

        # Generator update with unrolled discriminator
        fake_data = self.generator(noise)
        g_loss = self._compute_g_loss(fake_data, criterion)
        optimizer_G.zero_grad()
        g_loss.backward()
        optimizer_G.step()

        # Restore discriminator state
        self.discriminator.load_state_dict(d_state)

        # Single discriminator update
        fake_data = self.generator(noise).detach()
        d_loss = self._compute_d_loss(real_data, fake_data, criterion)
        optimizer_D.zero_grad()
        d_loss.backward()
        optimizer_D.step()

        return d_loss.item(), g_loss.item()
```

### Other Training Challenges

**1. Vanishing Gradients:**
- Use non-saturating loss for Generator
- Apply spectral normalization
- Use WGAN or LSGAN losses

**2. Training Instability:**
- Use batch normalization in Generator
- Use layer normalization or spectral normalization in Discriminator
- Apply gradient penalty (WGAN-GP)

**3. Checking Model Quality:**
- Use Frechet Inception Distance (FID)
- Use Inception Score (IS)
- Visual inspection of generated samples

```python
def compute_fid(real_features, fake_features):
    """Compute Frechet Inception Distance"""
    import numpy as np
    from scipy import linalg

    # Compute statistics
    mu_real = np.mean(real_features, axis=0)
    mu_fake = np.mean(fake_features, axis=0)
    sigma_real = np.cov(real_features, rowvar=False)
    sigma_fake = np.cov(fake_features, rowvar=False)

    # Compute FID
    diff = mu_real - mu_fake
    covmean, _ = linalg.sqrtm(sigma_real @ sigma_fake, disp=False)

    if np.iscomplexobj(covmean):
        covmean = covmean.real

    fid = diff @ diff + np.trace(sigma_real + sigma_fake - 2 * covmean)
    return fid
```

---

## Popular GAN Variants

### DCGAN (Deep Convolutional GAN)

DCGAN established architectural guidelines for stable GAN training:

**Key principles:**
- Replace pooling with strided convolutions
- Use batch normalization in both networks
- Remove fully connected layers
- Use ReLU in Generator, LeakyReLU in Discriminator
- Use Tanh in Generator output

```python
class DCGANGenerator(nn.Module):
    """DCGAN Generator with architectural guidelines"""

    def __init__(self, latent_dim=100, channels=3, feature_maps=64):
        super().__init__()

        self.main = nn.Sequential(
            # Project and reshape
            nn.ConvTranspose2d(latent_dim, feature_maps * 8, 4, 1, 0, bias=False),
            nn.BatchNorm2d(feature_maps * 8),
            nn.ReLU(True),

            nn.ConvTranspose2d(feature_maps * 8, feature_maps * 4, 4, 2, 1, bias=False),
            nn.BatchNorm2d(feature_maps * 4),
            nn.ReLU(True),

            nn.ConvTranspose2d(feature_maps * 4, feature_maps * 2, 4, 2, 1, bias=False),
            nn.BatchNorm2d(feature_maps * 2),
            nn.ReLU(True),

            nn.ConvTranspose2d(feature_maps * 2, feature_maps, 4, 2, 1, bias=False),
            nn.BatchNorm2d(feature_maps),
            nn.ReLU(True),

            nn.ConvTranspose2d(feature_maps, channels, 4, 2, 1, bias=False),
            nn.Tanh()
        )

        # Weight initialization
        self.apply(self._init_weights)

    def _init_weights(self, module):
        if isinstance(module, (nn.Conv2d, nn.ConvTranspose2d)):
            nn.init.normal_(module.weight, 0.0, 0.02)
        elif isinstance(module, nn.BatchNorm2d):
            nn.init.normal_(module.weight, 1.0, 0.02)
            nn.init.constant_(module.bias, 0)

    def forward(self, z):
        return self.main(z.view(-1, z.size(1), 1, 1))
```

### StyleGAN

StyleGAN introduced a style-based generator architecture for high-quality image synthesis:

**Key innovations:**
- Mapping network to transform latent code
- Adaptive Instance Normalization (AdaIN)
- Progressive growing (inherited from ProGAN)
- Style mixing regularization

```python
class MappingNetwork(nn.Module):
    """StyleGAN Mapping Network"""

    def __init__(self, latent_dim=512, style_dim=512, num_layers=8):
        super().__init__()

        layers = []
        for i in range(num_layers):
            in_features = latent_dim if i == 0 else style_dim
            layers.append(nn.Linear(in_features, style_dim))
            layers.append(nn.LeakyReLU(0.2))

        self.mapping = nn.Sequential(*layers)

    def forward(self, z):
        return self.mapping(z)


class AdaIN(nn.Module):
    """Adaptive Instance Normalization"""

    def __init__(self, style_dim, channels):
        super().__init__()
        self.norm = nn.InstanceNorm2d(channels)
        self.style_scale = nn.Linear(style_dim, channels)
        self.style_bias = nn.Linear(style_dim, channels)

    def forward(self, x, w):
        # Normalize
        x = self.norm(x)

        # Apply style
        scale = self.style_scale(w).unsqueeze(-1).unsqueeze(-1)
        bias = self.style_bias(w).unsqueeze(-1).unsqueeze(-1)

        return scale * x + bias


class StyleBlock(nn.Module):
    """StyleGAN synthesis block"""

    def __init__(self, in_channels, out_channels, style_dim):
        super().__init__()

        self.conv1 = nn.Conv2d(in_channels, out_channels, 3, 1, 1)
        self.adain1 = AdaIN(style_dim, out_channels)
        self.conv2 = nn.Conv2d(out_channels, out_channels, 3, 1, 1)
        self.adain2 = AdaIN(style_dim, out_channels)
        self.activation = nn.LeakyReLU(0.2)

        # Noise injection
        self.noise_scale1 = nn.Parameter(torch.zeros(1, out_channels, 1, 1))
        self.noise_scale2 = nn.Parameter(torch.zeros(1, out_channels, 1, 1))

    def forward(self, x, w, noise=None):
        # First convolution + style
        x = self.conv1(x)
        if noise is not None:
            x = x + self.noise_scale1 * noise
        x = self.activation(x)
        x = self.adain1(x, w)

        # Second convolution + style
        x = self.conv2(x)
        if noise is not None:
            x = x + self.noise_scale2 * noise
        x = self.activation(x)
        x = self.adain2(x, w)

        return x
```

### CycleGAN

CycleGAN enables unpaired image-to-image translation using cycle consistency:

**Key concepts:**
- Two generators (G: X -> Y, F: Y -> X)
- Two discriminators (D_X, D_Y)
- Cycle consistency loss: $||F(G(x)) - x|| + ||G(F(y)) - y||$

```python
class ResidualBlock(nn.Module):
    """Residual block for CycleGAN Generator"""

    def __init__(self, channels):
        super().__init__()
        self.block = nn.Sequential(
            nn.ReflectionPad2d(1),
            nn.Conv2d(channels, channels, 3),
            nn.InstanceNorm2d(channels),
            nn.ReLU(inplace=True),
            nn.ReflectionPad2d(1),
            nn.Conv2d(channels, channels, 3),
            nn.InstanceNorm2d(channels)
        )

    def forward(self, x):
        return x + self.block(x)


class CycleGANGenerator(nn.Module):
    """CycleGAN Generator (ResNet-based)"""

    def __init__(self, in_channels=3, out_channels=3, num_residual=9):
        super().__init__()

        # Initial convolution
        model = [
            nn.ReflectionPad2d(3),
            nn.Conv2d(in_channels, 64, 7),
            nn.InstanceNorm2d(64),
            nn.ReLU(inplace=True)
        ]

        # Downsampling
        in_features = 64
        out_features = in_features * 2
        for _ in range(2):
            model += [
                nn.Conv2d(in_features, out_features, 3, stride=2, padding=1),
                nn.InstanceNorm2d(out_features),
                nn.ReLU(inplace=True)
            ]
            in_features = out_features
            out_features = in_features * 2

        # Residual blocks
        for _ in range(num_residual):
            model += [ResidualBlock(in_features)]

        # Upsampling
        out_features = in_features // 2
        for _ in range(2):
            model += [
                nn.ConvTranspose2d(in_features, out_features, 3, stride=2,
                                   padding=1, output_padding=1),
                nn.InstanceNorm2d(out_features),
                nn.ReLU(inplace=True)
            ]
            in_features = out_features
            out_features = in_features // 2

        # Output layer
        model += [
            nn.ReflectionPad2d(3),
            nn.Conv2d(64, out_channels, 7),
            nn.Tanh()
        ]

        self.model = nn.Sequential(*model)

    def forward(self, x):
        return self.model(x)


class CycleGANTrainer:
    """CycleGAN training procedure"""

    def __init__(self, G_AB, G_BA, D_A, D_B, lambda_cycle=10.0, lambda_identity=0.5):
        self.G_AB = G_AB  # X -> Y
        self.G_BA = G_BA  # Y -> X
        self.D_A = D_A
        self.D_B = D_B
        self.lambda_cycle = lambda_cycle
        self.lambda_identity = lambda_identity

        self.criterion_GAN = nn.MSELoss()
        self.criterion_cycle = nn.L1Loss()
        self.criterion_identity = nn.L1Loss()

    def compute_losses(self, real_A, real_B, device='cuda'):
        """Compute all CycleGAN losses"""
        batch_size = real_A.size(0)

        # Adversarial ground truths
        valid = torch.ones(batch_size, 1, device=device)
        fake = torch.zeros(batch_size, 1, device=device)

        # Generate fake images
        fake_B = self.G_AB(real_A)
        fake_A = self.G_BA(real_B)

        # Cycle consistency
        recovered_A = self.G_BA(fake_B)
        recovered_B = self.G_AB(fake_A)

        # Identity mapping (optional)
        identity_A = self.G_BA(real_A)
        identity_B = self.G_AB(real_B)

        # Generator losses
        loss_GAN_AB = self.criterion_GAN(self.D_B(fake_B), valid)
        loss_GAN_BA = self.criterion_GAN(self.D_A(fake_A), valid)
        loss_GAN = loss_GAN_AB + loss_GAN_BA

        # Cycle consistency losses
        loss_cycle_A = self.criterion_cycle(recovered_A, real_A)
        loss_cycle_B = self.criterion_cycle(recovered_B, real_B)
        loss_cycle = self.lambda_cycle * (loss_cycle_A + loss_cycle_B)

        # Identity losses
        loss_identity_A = self.criterion_identity(identity_A, real_A)
        loss_identity_B = self.criterion_identity(identity_B, real_B)
        loss_identity = self.lambda_identity * self.lambda_cycle * \
                       (loss_identity_A + loss_identity_B)

        # Total Generator loss
        loss_G = loss_GAN + loss_cycle + loss_identity

        # Discriminator losses
        loss_D_A = 0.5 * (self.criterion_GAN(self.D_A(real_A), valid) +
                         self.criterion_GAN(self.D_A(fake_A.detach()), fake))
        loss_D_B = 0.5 * (self.criterion_GAN(self.D_B(real_B), valid) +
                         self.criterion_GAN(self.D_B(fake_B.detach()), fake))
        loss_D = loss_D_A + loss_D_B

        return {
            'G': loss_G,
            'D': loss_D,
            'cycle': loss_cycle,
            'identity': loss_identity,
            'GAN': loss_GAN
        }
```

### Conditional GAN (cGAN)

Conditional GANs generate data conditioned on additional information (class labels, text, images):

```python
class ConditionalGenerator(nn.Module):
    """Conditional Generator with label embedding"""

    def __init__(self, latent_dim=100, num_classes=10, channels=1, feature_maps=64):
        super().__init__()

        self.label_embedding = nn.Embedding(num_classes, latent_dim)

        self.main = nn.Sequential(
            nn.ConvTranspose2d(latent_dim * 2, feature_maps * 4, 4, 1, 0, bias=False),
            nn.BatchNorm2d(feature_maps * 4),
            nn.ReLU(True),

            nn.ConvTranspose2d(feature_maps * 4, feature_maps * 2, 4, 2, 1, bias=False),
            nn.BatchNorm2d(feature_maps * 2),
            nn.ReLU(True),

            nn.ConvTranspose2d(feature_maps * 2, feature_maps, 4, 2, 1, bias=False),
            nn.BatchNorm2d(feature_maps),
            nn.ReLU(True),

            nn.ConvTranspose2d(feature_maps, channels, 4, 2, 1, bias=False),
            nn.Tanh()
        )

    def forward(self, z, labels):
        # Embed labels and concatenate with noise
        label_embed = self.label_embedding(labels)
        x = torch.cat([z, label_embed], dim=1)
        x = x.view(-1, x.size(1), 1, 1)
        return self.main(x)


class ConditionalDiscriminator(nn.Module):
    """Conditional Discriminator with label projection"""

    def __init__(self, num_classes=10, channels=1, feature_maps=64):
        super().__init__()

        self.features = nn.Sequential(
            nn.Conv2d(channels, feature_maps, 4, 2, 1, bias=False),
            nn.LeakyReLU(0.2, inplace=True),

            nn.Conv2d(feature_maps, feature_maps * 2, 4, 2, 1, bias=False),
            nn.BatchNorm2d(feature_maps * 2),
            nn.LeakyReLU(0.2, inplace=True),

            nn.Conv2d(feature_maps * 2, feature_maps * 4, 4, 2, 1, bias=False),
            nn.BatchNorm2d(feature_maps * 4),
            nn.LeakyReLU(0.2, inplace=True),
        )

        self.classifier = nn.Linear(feature_maps * 4 * 4 * 4, 1)
        self.label_embedding = nn.Embedding(num_classes, feature_maps * 4 * 4 * 4)

    def forward(self, x, labels):
        features = self.features(x)
        features = features.view(features.size(0), -1)

        # Project labels
        label_embed = self.label_embedding(labels)

        # Inner product for class-conditional discrimination
        output = self.classifier(features) + (features * label_embed).sum(dim=1, keepdim=True)

        return torch.sigmoid(output).squeeze()
```

---

## Applications

### Image Generation

GANs excel at generating photorealistic images:

- **Face generation**: StyleGAN, ProGAN
- **Art creation**: BigGAN, VQGAN
- **Scene synthesis**: SPADE, GauGAN

### Image-to-Image Translation

Converting images from one domain to another:

- **Style transfer**: Neural Style Transfer with GANs
- **Domain adaptation**: CycleGAN, UNIT
- **Semantic editing**: pix2pix, pix2pixHD

### Super Resolution

Enhancing image resolution:

```python
class SRResNet(nn.Module):
    """Super Resolution Generator"""

    def __init__(self, scale_factor=4, in_channels=3, num_residual=16):
        super().__init__()

        # Initial feature extraction
        self.conv1 = nn.Sequential(
            nn.Conv2d(in_channels, 64, 9, 1, 4),
            nn.PReLU()
        )

        # Residual blocks
        self.residual_blocks = nn.Sequential(
            *[ResidualBlock(64) for _ in range(num_residual)]
        )

        self.conv2 = nn.Sequential(
            nn.Conv2d(64, 64, 3, 1, 1),
            nn.BatchNorm2d(64)
        )

        # Upsampling
        upsample_layers = []
        for _ in range(scale_factor // 2):
            upsample_layers += [
                nn.Conv2d(64, 256, 3, 1, 1),
                nn.PixelShuffle(2),
                nn.PReLU()
            ]
        self.upsample = nn.Sequential(*upsample_layers)

        # Output
        self.conv3 = nn.Conv2d(64, in_channels, 9, 1, 4)

    def forward(self, x):
        x1 = self.conv1(x)
        x = self.residual_blocks(x1)
        x = self.conv2(x) + x1
        x = self.upsample(x)
        return self.conv3(x)
```

### Data Augmentation

Using GANs to generate training data:

```python
class DataAugmentationGAN:
    """Use GAN for data augmentation"""

    def __init__(self, generator, latent_dim=100):
        self.generator = generator
        self.latent_dim = latent_dim

    def generate_samples(self, num_samples, labels=None, device='cuda'):
        """Generate synthetic training samples"""
        self.generator.train(False)  # Set to inference mode

        with torch.no_grad():
            noise = torch.randn(num_samples, self.latent_dim, device=device)

            if labels is not None:
                samples = self.generator(noise, labels)
            else:
                samples = self.generator(noise)

        return samples

    def augment_dataset(self, real_data, real_labels, augmentation_ratio=0.5):
        """Augment real dataset with generated samples"""
        num_synthetic = int(len(real_data) * augmentation_ratio)

        # Generate synthetic samples
        synthetic_labels = real_labels[torch.randint(0, len(real_labels), (num_synthetic,))]
        synthetic_data = self.generate_samples(num_synthetic, synthetic_labels)

        # Combine real and synthetic
        augmented_data = torch.cat([real_data, synthetic_data])
        augmented_labels = torch.cat([real_labels, synthetic_labels])

        return augmented_data, augmented_labels
```

### Other Applications

- **Text-to-Image**: StackGAN, AttnGAN
- **Video Generation**: MoCoGAN, DVD-GAN
- **3D Object Generation**: 3D-GAN
- **Medical Imaging**: Generating synthetic CT/MRI scans
- **Drug Discovery**: Generating molecular structures
- **Anomaly Detection**: Using discriminator scores

---

## PyTorch Implementation

### Complete GAN Training Pipeline

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from torchvision.utils import save_image, make_grid
import matplotlib.pyplot as plt
from tqdm import tqdm
import os


class GANTrainer:
    """Complete GAN training pipeline"""

    def __init__(self, generator, discriminator, latent_dim=100,
                 lr_g=0.0002, lr_d=0.0002, beta1=0.5, device='cuda'):
        self.generator = generator.to(device)
        self.discriminator = discriminator.to(device)
        self.latent_dim = latent_dim
        self.device = device

        # Initialize weights
        self.generator.apply(self._init_weights)
        self.discriminator.apply(self._init_weights)

        # Optimizers
        self.optimizer_G = optim.Adam(generator.parameters(), lr=lr_g, betas=(beta1, 0.999))
        self.optimizer_D = optim.Adam(discriminator.parameters(), lr=lr_d, betas=(beta1, 0.999))

        # Loss function
        self.criterion = nn.BCELoss()

        # Training history
        self.g_losses = []
        self.d_losses = []
        self.fixed_noise = torch.randn(64, latent_dim, device=device)

    def _init_weights(self, m):
        classname = m.__class__.__name__
        if classname.find('Conv') != -1:
            nn.init.normal_(m.weight.data, 0.0, 0.02)
        elif classname.find('BatchNorm') != -1:
            nn.init.normal_(m.weight.data, 1.0, 0.02)
            nn.init.constant_(m.bias.data, 0)

    def train_step(self, real_data):
        """Single training step"""
        batch_size = real_data.size(0)
        real_data = real_data.to(self.device)

        # Labels
        real_labels = torch.ones(batch_size, device=self.device)
        fake_labels = torch.zeros(batch_size, device=self.device)

        # ---------------------
        # Train Discriminator
        # ---------------------
        self.discriminator.zero_grad()

        # Real data
        output_real = self.discriminator(real_data)
        loss_real = self.criterion(output_real, real_labels)

        # Fake data
        noise = torch.randn(batch_size, self.latent_dim, device=self.device)
        fake_data = self.generator(noise)
        output_fake = self.discriminator(fake_data.detach())
        loss_fake = self.criterion(output_fake, fake_labels)

        # Combined loss
        loss_D = loss_real + loss_fake
        loss_D.backward()
        self.optimizer_D.step()

        # -----------------
        # Train Generator
        # -----------------
        self.generator.zero_grad()

        output = self.discriminator(fake_data)
        loss_G = self.criterion(output, real_labels)
        loss_G.backward()
        self.optimizer_G.step()

        return loss_D.item(), loss_G.item()

    def train(self, dataloader, num_epochs, save_dir='./results'):
        """Full training loop"""
        os.makedirs(save_dir, exist_ok=True)

        for epoch in range(num_epochs):
            epoch_d_loss = 0
            epoch_g_loss = 0

            pbar = tqdm(dataloader, desc=f'Epoch {epoch+1}/{num_epochs}')
            for batch_idx, (real_data, _) in enumerate(pbar):
                d_loss, g_loss = self.train_step(real_data)
                epoch_d_loss += d_loss
                epoch_g_loss += g_loss

                pbar.set_postfix({'D_loss': f'{d_loss:.4f}', 'G_loss': f'{g_loss:.4f}'})

            # Record average losses
            self.d_losses.append(epoch_d_loss / len(dataloader))
            self.g_losses.append(epoch_g_loss / len(dataloader))

            # Save generated images
            if (epoch + 1) % 10 == 0:
                self._save_samples(epoch + 1, save_dir)

            print(f'Epoch [{epoch+1}/{num_epochs}] '
                  f'D_loss: {self.d_losses[-1]:.4f} '
                  f'G_loss: {self.g_losses[-1]:.4f}')

        # Plot training curves
        self._plot_losses(save_dir)

    def _save_samples(self, epoch, save_dir):
        """Save generated samples"""
        self.generator.train(False)  # Set to inference mode
        with torch.no_grad():
            fake = self.generator(self.fixed_noise)
            save_image(fake, f'{save_dir}/epoch_{epoch}.png',
                      nrow=8, normalize=True)
        self.generator.train(True)  # Set back to training mode

    def _plot_losses(self, save_dir):
        """Plot training losses"""
        plt.figure(figsize=(10, 5))
        plt.plot(self.g_losses, label='Generator')
        plt.plot(self.d_losses, label='Discriminator')
        plt.xlabel('Epoch')
        plt.ylabel('Loss')
        plt.legend()
        plt.title('GAN Training Losses')
        plt.savefig(f'{save_dir}/losses.png')
        plt.close()

    def generate(self, num_samples):
        """Generate new samples"""
        self.generator.train(False)  # Set to inference mode
        with torch.no_grad():
            noise = torch.randn(num_samples, self.latent_dim, device=self.device)
            samples = self.generator(noise)
        return samples


def main():
    """Main training script"""
    # Hyperparameters
    latent_dim = 100
    batch_size = 64
    num_epochs = 100
    image_size = 64
    channels = 3

    # Device
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f'Using device: {device}')

    # Data preprocessing
    transform = transforms.Compose([
        transforms.Resize(image_size),
        transforms.CenterCrop(image_size),
        transforms.ToTensor(),
        transforms.Normalize([0.5] * channels, [0.5] * channels)
    ])

    # Load dataset (example with CIFAR-10)
    dataset = datasets.CIFAR10(
        root='./data',
        train=True,
        download=True,
        transform=transform
    )
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True, num_workers=4)

    # Create models
    generator = Generator(latent_dim=latent_dim, channels=channels)
    discriminator = Discriminator(channels=channels)

    # Create trainer and train
    trainer = GANTrainer(generator, discriminator, latent_dim=latent_dim, device=device)
    trainer.train(dataloader, num_epochs=num_epochs)

    # Generate samples
    samples = trainer.generate(16)
    save_image(samples, 'generated_samples.png', nrow=4, normalize=True)

    # Save models
    torch.save(generator.state_dict(), 'generator.pth')
    torch.save(discriminator.state_dict(), 'discriminator.pth')


if __name__ == '__main__':
    main()
```

### WGAN-GP Implementation

```python
class WGANGPTrainer:
    """Wasserstein GAN with Gradient Penalty trainer"""

    def __init__(self, generator, critic, latent_dim=100,
                 lr=0.0001, n_critic=5, lambda_gp=10, device='cuda'):
        self.generator = generator.to(device)
        self.critic = critic.to(device)
        self.latent_dim = latent_dim
        self.n_critic = n_critic
        self.lambda_gp = lambda_gp
        self.device = device

        # RMSprop optimizer (as in original WGAN paper)
        self.optimizer_G = optim.Adam(generator.parameters(), lr=lr, betas=(0.0, 0.9))
        self.optimizer_C = optim.Adam(critic.parameters(), lr=lr, betas=(0.0, 0.9))

    def compute_gradient_penalty(self, real_data, fake_data):
        """Compute gradient penalty for WGAN-GP"""
        batch_size = real_data.size(0)

        # Random interpolation
        alpha = torch.rand(batch_size, 1, 1, 1, device=self.device)
        interpolated = alpha * real_data + (1 - alpha) * fake_data
        interpolated.requires_grad_(True)

        # Critic score on interpolated
        d_interpolated = self.critic(interpolated)

        # Compute gradients
        gradients = torch.autograd.grad(
            outputs=d_interpolated,
            inputs=interpolated,
            grad_outputs=torch.ones_like(d_interpolated),
            create_graph=True,
            retain_graph=True
        )[0]

        # Gradient penalty
        gradients = gradients.view(batch_size, -1)
        gradient_penalty = ((gradients.norm(2, dim=1) - 1) ** 2).mean()

        return gradient_penalty

    def train_step(self, real_data):
        """Single training step"""
        batch_size = real_data.size(0)
        real_data = real_data.to(self.device)

        # ----------------
        # Train Critic
        # ----------------
        for _ in range(self.n_critic):
            self.critic.zero_grad()

            # Generate fake data
            noise = torch.randn(batch_size, self.latent_dim, device=self.device)
            fake_data = self.generator(noise)

            # Critic loss
            c_real = self.critic(real_data).mean()
            c_fake = self.critic(fake_data.detach()).mean()
            gp = self.compute_gradient_penalty(real_data, fake_data.detach())

            loss_C = c_fake - c_real + self.lambda_gp * gp
            loss_C.backward()
            self.optimizer_C.step()

        # -----------------
        # Train Generator
        # -----------------
        self.generator.zero_grad()

        noise = torch.randn(batch_size, self.latent_dim, device=self.device)
        fake_data = self.generator(noise)

        loss_G = -self.critic(fake_data).mean()
        loss_G.backward()
        self.optimizer_G.step()

        return loss_C.item(), loss_G.item(), (c_real - c_fake).item()
```

---

## Best Practices and Tips

### Architecture Guidelines

1. **Generator:**
   - Use transposed convolutions for upsampling
   - Batch normalization in all layers except output
   - ReLU activation, Tanh for output
   - Start with 4x4 feature maps

2. **Discriminator:**
   - Use strided convolutions for downsampling
   - LeakyReLU (slope 0.2) throughout
   - Batch normalization except input layer
   - No fully connected layers if possible

### Training Stability Tips

```python
class TrainingTips:
    """Collection of training stability techniques"""

    @staticmethod
    def label_smoothing(real_labels, fake_labels, smooth=0.1):
        """Apply label smoothing"""
        real_labels = real_labels * (1 - smooth) + 0.5 * smooth
        return real_labels, fake_labels

    @staticmethod
    def add_instance_noise(data, std=0.1):
        """Add noise to discriminator input"""
        noise = torch.randn_like(data) * std
        return data + noise

    @staticmethod
    def spectral_norm(module):
        """Apply spectral normalization"""
        return nn.utils.spectral_norm(module)

    @staticmethod
    def exponential_moving_average(model_ema, model, decay=0.999):
        """Update EMA model parameters"""
        with torch.no_grad():
            for p_ema, p in zip(model_ema.parameters(), model.parameters()):
                p_ema.data.mul_(decay).add_(p.data, alpha=1 - decay)
```

### Monitoring and Metrics

```python
import torch
from torchvision.models import inception_v3
from scipy import linalg
import numpy as np


class GANMetrics:
    """GAN monitoring metrics"""

    def __init__(self, device='cuda'):
        self.device = device
        self.inception = inception_v3(pretrained=True, transform_input=False)
        self.inception.fc = nn.Identity()  # Remove final layer
        self.inception = self.inception.to(device)
        self.inception.train(False)  # Set to inference mode

    @torch.no_grad()
    def get_inception_features(self, images):
        """Extract Inception features"""
        # Resize to 299x299 for Inception
        images = nn.functional.interpolate(images, size=(299, 299), mode='bilinear')
        features = self.inception(images)
        return features.cpu().numpy()

    def compute_fid(self, real_images, fake_images):
        """Compute Frechet Inception Distance"""
        # Get features
        real_features = self.get_inception_features(real_images)
        fake_features = self.get_inception_features(fake_images)

        # Compute statistics
        mu_real, sigma_real = real_features.mean(0), np.cov(real_features, rowvar=False)
        mu_fake, sigma_fake = fake_features.mean(0), np.cov(fake_features, rowvar=False)

        # Compute FID
        diff = mu_real - mu_fake
        covmean = linalg.sqrtm(sigma_real @ sigma_fake)

        if np.iscomplexobj(covmean):
            covmean = covmean.real

        fid = diff @ diff + np.trace(sigma_real + sigma_fake - 2 * covmean)
        return fid

    def compute_inception_score(self, images, splits=10):
        """Compute Inception Score"""
        # Get predictions
        preds = []
        for i in range(0, len(images), 32):
            batch = images[i:i+32].to(self.device)
            batch = nn.functional.interpolate(batch, size=(299, 299), mode='bilinear')
            with torch.no_grad():
                pred = nn.functional.softmax(self.inception(batch), dim=1)
            preds.append(pred.cpu().numpy())

        preds = np.concatenate(preds, axis=0)

        # Compute IS
        scores = []
        for i in range(splits):
            part = preds[i * (len(preds) // splits):(i + 1) * (len(preds) // splits)]
            kl = part * (np.log(part) - np.log(np.mean(part, axis=0, keepdims=True)))
            kl = np.mean(np.sum(kl, axis=1))
            scores.append(np.exp(kl))

        return np.mean(scores), np.std(scores)
```

---

## Interview Questions

### Conceptual Questions

**Q1: Explain the core idea behind GANs and the minimax game.**

A: GANs consist of two networks playing a minimax game. The Generator creates fake samples from random noise, trying to fool the Discriminator. The Discriminator classifies samples as real or fake. Through adversarial training, the Generator learns to produce increasingly realistic samples while the Discriminator becomes better at detection. At equilibrium, the Generator produces samples indistinguishable from real data, and the Discriminator outputs 0.5 for all samples.

**Q2: What is mode collapse and how can it be addressed?**

A: Mode collapse occurs when the Generator produces limited variety of outputs, failing to capture the full data distribution. Solutions include:
- Minibatch discrimination: Encourages diversity by having Discriminator look at batches
- Unrolled GANs: Update Generator based on future Discriminator states
- Feature matching: Match statistics of generated features to real features
- WGAN/WGAN-GP: Use Wasserstein distance for more stable training
- Spectral normalization: Stabilize Discriminator training

**Q3: Why do we use Tanh activation in the Generator output?**

A: Tanh outputs values in [-1, 1], matching the typical image normalization range. This helps with:
- Stable gradient flow (bounded outputs)
- Easy conversion to pixel values [0, 255]
- Symmetric output distribution centered at 0

### Technical Questions

**Q4: Explain the gradient penalty in WGAN-GP.**

A: The gradient penalty enforces the Lipschitz constraint on the critic (Discriminator) by penalizing gradients that deviate from norm 1. For interpolated points between real and fake samples:
$$GP = \lambda \mathbb{E}[(||\nabla_{\hat{x}} D(\hat{x})||_2 - 1)^2]$$

This replaces weight clipping in original WGAN and provides more stable training.

**Q5: How does StyleGAN differ from traditional GANs?**

A: StyleGAN introduces:
- Mapping network: Transforms latent z to intermediate w space
- Adaptive Instance Normalization (AdaIN): Injects style at each layer
- Noise injection: Adds stochastic variation for fine details
- Progressive growing: Trains from low to high resolution
- Style mixing: Regularization by mixing styles from different latents

**Q6: Compare different GAN loss functions.**

A:
| Loss | Formula | Pros | Cons |
|------|---------|------|------|
| BCE | -[y log(D(x)) + (1-y) log(1-D(x))] | Simple, standard | Vanishing gradients |
| Wasserstein | E[D(real)] - E[D(fake)] | Stable, meaningful metric | Requires Lipschitz constraint |
| Hinge | max(0, 1-D(real)) + max(0, 1+D(fake)) | Stable, used in BigGAN | Bounded gradients |
| LSGAN | (D(x)-1)^2 + D(G(z))^2 | Stable, fewer mode drops | May produce blurry images |

### Implementation Questions

**Q7: Implement a simple GAN training loop.**

```python
def train_gan_simple(G, D, dataloader, epochs, latent_dim, device):
    criterion = nn.BCELoss()
    opt_G = optim.Adam(G.parameters(), lr=0.0002)
    opt_D = optim.Adam(D.parameters(), lr=0.0002)

    for epoch in range(epochs):
        for real, _ in dataloader:
            batch_size = real.size(0)
            real = real.to(device)

            # Train D
            opt_D.zero_grad()
            real_labels = torch.ones(batch_size, device=device)
            fake_labels = torch.zeros(batch_size, device=device)

            d_real = D(real)
            noise = torch.randn(batch_size, latent_dim, device=device)
            fake = G(noise)
            d_fake = D(fake.detach())

            loss_D = criterion(d_real, real_labels) + criterion(d_fake, fake_labels)
            loss_D.backward()
            opt_D.step()

            # Train G
            opt_G.zero_grad()
            d_fake = D(fake)
            loss_G = criterion(d_fake, real_labels)
            loss_G.backward()
            opt_G.step()
```

**Q8: How would you debug a GAN that is not converging?**

A:
1. Check losses: D loss should oscillate around 0.5-0.7, G loss should decrease
2. Visualize generated samples regularly
3. Monitor gradient magnitudes (should not vanish or explode)
4. Try different learning rates (typically D should train slower)
5. Add batch normalization if missing
6. Use spectral normalization for stability
7. Try WGAN-GP if standard GAN fails
8. Check data preprocessing (normalization to [-1, 1])

---

## Further Reading

### Foundational Papers

1. **Generative Adversarial Nets** (2014) - Original GAN paper by Goodfellow et al.
2. **Unsupervised Representation Learning with DCGANs** (2016) - DCGAN architecture
3. **Wasserstein GAN** (2017) - WGAN and Wasserstein distance
4. **Progressive Growing of GANs** (2018) - ProGAN for high-resolution synthesis
5. **A Style-Based Generator Architecture** (2019) - StyleGAN

### Advanced Topics

- **BigGAN**: Large-scale GAN training techniques
- **StyleGAN2/3**: Improvements to StyleGAN architecture
- **Diffusion Models**: Alternative generative approach gaining popularity
- **GAN Inversion**: Mapping real images to latent space
- **Neural Radiance Fields (NeRF)**: 3D scene synthesis

### Recommended Resources

1. **GAN Lab** - Interactive visualization of GAN training
2. **PyTorch GAN Zoo** - Collection of GAN implementations
3. **Papers With Code** - GAN benchmarks and implementations
4. **Distill.pub** - Visual explanations of deep learning concepts

---

## Summary

Generative Adversarial Networks represent a paradigm shift in generative modeling, enabling the creation of highly realistic synthetic data. Key takeaways:

1. **Core Concept**: Two networks (Generator and Discriminator) compete in a minimax game
2. **Architecture**: DCGAN guidelines provide stable training foundations
3. **Challenges**: Mode collapse and training instability require careful handling
4. **Variants**: WGAN-GP, StyleGAN, CycleGAN address specific use cases
5. **Applications**: Image generation, style transfer, super-resolution, data augmentation
6. **Monitoring**: FID and Inception Score are standard metrics

Understanding GANs is essential for modern deep learning practitioners, as they form the foundation for many state-of-the-art generative models and continue to influence the development of newer approaches like diffusion models.
