---
title: Advanced Loss Functions in Deep Learning
description: "Comprehensive guide to specialized loss functions: Contrastive Loss, Focal Loss, Knowledge Distillation Loss, and Triplet Loss with PyTorch implementations"
track: ai
section: deep-learning
difficulty: intermediate
tags:
  - loss functions
  - deep learning
  - PyTorch
  - contrastive learning
  - knowledge distillation
status: imported
origin: old/src/content/docs/datascience/loss-functions.en.md
divergence: 0.239
issues: []
legacy:
  category: DataScience
  subcategory: DeepLearning
  order: 20
  lastUpdated: 2026-01-07
---

Loss functions are the cornerstone of neural network training, guiding the optimization process by quantifying the discrepancy between predictions and ground truth. While standard losses like Cross-Entropy and Mean Squared Error serve many purposes, specialized scenarios demand more sophisticated loss functions. We'll explore four advanced loss functions that have become essential tools in modern deep learning: Contrastive Loss, Focal Loss, Knowledge Distillation Loss, and Triplet Loss.

---

## Introduction to Loss Functions

### The Role of Loss Functions

A loss function (also called cost function or objective function) measures how well a model's predictions match the expected outputs. During training, the optimizer adjusts model parameters to minimize this loss. The choice of loss function directly impacts:

- **Convergence speed**: How quickly the model learns
- **Final performance**: The quality of the trained model
- **Gradient behavior**: How gradients flow through the network
- **Handling of edge cases**: How the model deals with hard examples or imbalanced data

### Standard Loss Functions Recap

Before diving into advanced losses, let's briefly review the standard ones:

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

# Mean Squared Error (MSE) - Regression
mse_loss = nn.MSELoss()
predictions = torch.randn(32, 1)
targets = torch.randn(32, 1)
loss = mse_loss(predictions, targets)

# Binary Cross-Entropy - Binary Classification
bce_loss = nn.BCEWithLogitsLoss()
logits = torch.randn(32, 1)
binary_targets = torch.randint(0, 2, (32, 1)).float()
loss = bce_loss(logits, binary_targets)

# Cross-Entropy - Multi-class Classification
ce_loss = nn.CrossEntropyLoss()
logits = torch.randn(32, 10)  # 10 classes
class_targets = torch.randint(0, 10, (32,))
loss = ce_loss(logits, class_targets)
```

### When to Use Advanced Loss Functions

Advanced loss functions become necessary when:

- **Learning similarity**: You need to learn embeddings where similar items are close together (Contrastive Loss, Triplet Loss)
- **Class imbalance**: Some classes have far fewer samples than others (Focal Loss)
- **Model compression**: You want to transfer knowledge from a large model to a smaller one (Knowledge Distillation Loss)
- **Metric learning**: You need to learn a distance metric for retrieval or verification tasks

---

## Contrastive Loss

### Concept and Motivation

Contrastive Loss was introduced for learning embeddings in a way that similar pairs are pulled together while dissimilar pairs are pushed apart. It is fundamental to Siamese networks and modern self-supervised learning approaches.

**Key Idea**: Given pairs of samples, minimize the distance between similar pairs and maximize the distance (up to a margin) between dissimilar pairs.

### Mathematical Formulation

The original contrastive loss for a pair of samples $(x_i, x_j)$ with label $y$ (where $y=0$ for similar pairs and $y=1$ for dissimilar pairs):

$$L = (1 - y) \cdot \frac{1}{2} D^2 + y \cdot \frac{1}{2} \max(0, m - D)^2$$

Where:
- $D = ||f(x_i) - f(x_j)||_2$ is the Euclidean distance between embeddings
- $m$ is the margin (minimum distance for dissimilar pairs)
- $f(\cdot)$ is the embedding function (neural network)

### PyTorch Implementation

```python
import torch
import torch.nn as nn
import torch.nn.functional as F


class ContrastiveLoss(nn.Module):
    """
    Contrastive Loss for Siamese Networks.

    Learns embeddings where similar pairs have small distances
    and dissimilar pairs have distances greater than a margin.

    Args:
        margin: Minimum distance for dissimilar pairs (default: 1.0)
        reduction: 'mean', 'sum', or 'none' (default: 'mean')
    """

    def __init__(self, margin: float = 1.0, reduction: str = 'mean'):
        super().__init__()
        self.margin = margin
        self.reduction = reduction

    def forward(
        self,
        embedding1: torch.Tensor,
        embedding2: torch.Tensor,
        label: torch.Tensor
    ) -> torch.Tensor:
        """
        Compute contrastive loss.

        Args:
            embedding1: First embedding tensor of shape (batch_size, embedding_dim)
            embedding2: Second embedding tensor of shape (batch_size, embedding_dim)
            label: Binary labels (0 for similar, 1 for dissimilar) of shape (batch_size,)

        Returns:
            Contrastive loss value
        """
        # Compute Euclidean distance between embeddings
        distances = F.pairwise_distance(embedding1, embedding2, p=2)

        # Compute loss for similar pairs (label=0): minimize distance
        similar_loss = (1 - label) * torch.pow(distances, 2)

        # Compute loss for dissimilar pairs (label=1): maximize distance up to margin
        dissimilar_loss = label * torch.pow(
            torch.clamp(self.margin - distances, min=0.0), 2
        )

        # Combine losses
        loss = 0.5 * (similar_loss + dissimilar_loss)

        if self.reduction == 'mean':
            return loss.mean()
        elif self.reduction == 'sum':
            return loss.sum()
        else:
            return loss


# Example usage with a Siamese Network
class SiameseNetwork(nn.Module):
    """
    Siamese Network for learning similarity embeddings.
    """

    def __init__(self, input_dim: int = 784, embedding_dim: int = 128):
        super().__init__()
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 512),
            nn.ReLU(inplace=True),
            nn.BatchNorm1d(512),
            nn.Dropout(0.2),
            nn.Linear(512, 256),
            nn.ReLU(inplace=True),
            nn.BatchNorm1d(256),
            nn.Dropout(0.2),
            nn.Linear(256, embedding_dim)
        )

    def forward_one(self, x: torch.Tensor) -> torch.Tensor:
        """Encode a single input."""
        return self.encoder(x)

    def forward(
        self,
        x1: torch.Tensor,
        x2: torch.Tensor
    ) -> tuple:
        """Encode both inputs."""
        return self.forward_one(x1), self.forward_one(x2)


# Training example
def train_siamese_network():
    # Initialize model and loss
    model = SiameseNetwork(input_dim=784, embedding_dim=128)
    criterion = ContrastiveLoss(margin=2.0)
    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

    # Simulated batch
    batch_size = 32
    x1 = torch.randn(batch_size, 784)  # First images
    x2 = torch.randn(batch_size, 784)  # Second images
    labels = torch.randint(0, 2, (batch_size,)).float()  # 0=similar, 1=dissimilar

    # Training step
    model.train()
    optimizer.zero_grad()

    embedding1, embedding2 = model(x1, x2)
    loss = criterion(embedding1, embedding2, labels)

    loss.backward()
    optimizer.step()

    print(f"Contrastive Loss: {loss.item():.4f}")

    return loss.item()


# Run training example
train_siamese_network()
```

### InfoNCE Loss (Modern Contrastive Learning)

The InfoNCE loss, popularized by SimCLR and other self-supervised methods, extends contrastive learning to work with multiple negatives:

```python
class InfoNCELoss(nn.Module):
    """
    InfoNCE Loss for self-supervised contrastive learning.

    Used in SimCLR, MoCo, and other modern self-supervised frameworks.

    Args:
        temperature: Temperature parameter for scaling (default: 0.07)
    """

    def __init__(self, temperature: float = 0.07):
        super().__init__()
        self.temperature = temperature

    def forward(
        self,
        query: torch.Tensor,
        positive_key: torch.Tensor,
        negative_keys: torch.Tensor = None
    ) -> torch.Tensor:
        """
        Compute InfoNCE loss.

        Args:
            query: Query embeddings of shape (batch_size, embedding_dim)
            positive_key: Positive key embeddings (same shape as query)
            negative_keys: Optional negative keys of shape (num_negatives, embedding_dim)
                          If None, uses other samples in batch as negatives

        Returns:
            InfoNCE loss value
        """
        batch_size = query.shape[0]

        # Normalize embeddings
        query = F.normalize(query, dim=1)
        positive_key = F.normalize(positive_key, dim=1)

        # Compute positive logits
        positive_logits = torch.sum(query * positive_key, dim=1, keepdim=True)
        positive_logits = positive_logits / self.temperature

        if negative_keys is None:
            # Use other samples in batch as negatives
            all_logits = torch.mm(query, positive_key.t()) / self.temperature

            # Labels: positive pairs are on the diagonal
            labels = torch.arange(batch_size, device=query.device)

            # Cross-entropy loss
            loss = F.cross_entropy(all_logits, labels)
        else:
            # Use provided negative keys
            negative_keys = F.normalize(negative_keys, dim=1)
            negative_logits = torch.mm(query, negative_keys.t()) / self.temperature

            # Concatenate positive and negative logits
            logits = torch.cat([positive_logits, negative_logits], dim=1)

            # Labels: positive is always at index 0
            labels = torch.zeros(batch_size, dtype=torch.long, device=query.device)

            loss = F.cross_entropy(logits, labels)

        return loss
```

### Applications of Contrastive Loss

- **Face verification**: Learning whether two face images belong to the same person
- **Signature verification**: Determining if two signatures are from the same individual
- **One-shot learning**: Learning to recognize new classes from single examples
- **Self-supervised learning**: Pre-training representations without labels (SimCLR, MoCo)
- **Semantic similarity**: Learning text embeddings for similarity search

---

## Focal Loss

### Concept and Motivation

Focal Loss was introduced in the RetinaNet paper to address extreme class imbalance in object detection, where background examples vastly outnumber foreground objects. The key insight is to down-weight easy examples and focus training on hard, misclassified examples.

**Problem with Standard Cross-Entropy**: In highly imbalanced datasets, the model becomes overwhelmed by easy negative examples. Even though individual easy examples contribute small losses, their sheer number dominates the gradient, preventing the model from learning to detect rare positive examples.

### Mathematical Formulation

Starting from binary cross-entropy:

$$CE(p, y) = -y \log(p) - (1-y) \log(1-p)$$

Focal Loss introduces a modulating factor $(1 - p_t)^\gamma$:

$$FL(p_t) = -\alpha_t (1 - p_t)^\gamma \log(p_t)$$

Where:
- $p_t = p$ if $y=1$, else $p_t = 1-p$ (probability assigned to the correct class)
- $\gamma \geq 0$ is the focusing parameter (typically 2.0)
- $\alpha_t$ is the class balancing weight

**Key Properties**:
- When $\gamma = 0$, Focal Loss equals weighted Cross-Entropy
- As $\gamma$ increases, easy examples (high $p_t$) are down-weighted more aggressively
- The focusing effect helps the model concentrate on hard examples

### PyTorch Implementation

```python
class FocalLoss(nn.Module):
    """
    Focal Loss for addressing class imbalance.

    Originally designed for dense object detection (RetinaNet),
    but applicable to any classification problem with class imbalance.

    Args:
        alpha: Weighting factor for the positive class (default: 0.25)
        gamma: Focusing parameter (default: 2.0)
        reduction: 'mean', 'sum', or 'none' (default: 'mean')
    """

    def __init__(
        self,
        alpha: float = 0.25,
        gamma: float = 2.0,
        reduction: str = 'mean'
    ):
        super().__init__()
        self.alpha = alpha
        self.gamma = gamma
        self.reduction = reduction

    def forward(
        self,
        inputs: torch.Tensor,
        targets: torch.Tensor
    ) -> torch.Tensor:
        """
        Compute Focal Loss.

        Args:
            inputs: Predictions (logits) of shape (batch_size,) or (batch_size, num_classes)
            targets: Ground truth labels

        Returns:
            Focal loss value
        """
        # Handle binary classification
        if inputs.dim() == 1 or (inputs.dim() == 2 and inputs.shape[1] == 1):
            return self._binary_focal_loss(inputs.view(-1), targets.view(-1))

        # Handle multi-class classification
        return self._multiclass_focal_loss(inputs, targets)

    def _binary_focal_loss(
        self,
        inputs: torch.Tensor,
        targets: torch.Tensor
    ) -> torch.Tensor:
        """Binary focal loss."""
        # Convert logits to probabilities
        p = torch.sigmoid(inputs)

        # Compute cross-entropy
        ce_loss = F.binary_cross_entropy_with_logits(
            inputs, targets, reduction='none'
        )

        # Compute p_t (probability of correct class)
        p_t = p * targets + (1 - p) * (1 - targets)

        # Compute focal weight
        focal_weight = (1 - p_t) ** self.gamma

        # Apply alpha weighting
        alpha_t = self.alpha * targets + (1 - self.alpha) * (1 - targets)

        # Compute focal loss
        focal_loss = alpha_t * focal_weight * ce_loss

        if self.reduction == 'mean':
            return focal_loss.mean()
        elif self.reduction == 'sum':
            return focal_loss.sum()
        return focal_loss

    def _multiclass_focal_loss(
        self,
        inputs: torch.Tensor,
        targets: torch.Tensor
    ) -> torch.Tensor:
        """Multi-class focal loss."""
        num_classes = inputs.shape[1]

        # Compute softmax probabilities
        p = F.softmax(inputs, dim=1)

        # Get the probability of the true class
        ce_loss = F.cross_entropy(inputs, targets, reduction='none')
        p_t = p.gather(1, targets.unsqueeze(1)).squeeze(1)

        # Compute focal weight
        focal_weight = (1 - p_t) ** self.gamma

        # Compute focal loss
        focal_loss = focal_weight * ce_loss

        if self.reduction == 'mean':
            return focal_loss.mean()
        elif self.reduction == 'sum':
            return focal_loss.sum()
        return focal_loss


class FocalLossWithClassWeights(nn.Module):
    """
    Focal Loss with per-class alpha weights.

    Useful when you have different importance for different classes.

    Args:
        alpha: Per-class weights of shape (num_classes,)
        gamma: Focusing parameter (default: 2.0)
        reduction: 'mean', 'sum', or 'none' (default: 'mean')
    """

    def __init__(
        self,
        alpha: torch.Tensor,
        gamma: float = 2.0,
        reduction: str = 'mean'
    ):
        super().__init__()
        self.register_buffer('alpha', alpha)
        self.gamma = gamma
        self.reduction = reduction

    def forward(
        self,
        inputs: torch.Tensor,
        targets: torch.Tensor
    ) -> torch.Tensor:
        """Compute focal loss with class weights."""
        num_classes = inputs.shape[1]

        # Compute softmax probabilities
        p = F.softmax(inputs, dim=1)

        # Get class weights for each sample
        alpha_t = self.alpha[targets]

        # Compute cross-entropy
        ce_loss = F.cross_entropy(inputs, targets, reduction='none')

        # Get probability of true class
        p_t = p.gather(1, targets.unsqueeze(1)).squeeze(1)

        # Compute focal weight
        focal_weight = (1 - p_t) ** self.gamma

        # Apply both alpha and focal weighting
        focal_loss = alpha_t * focal_weight * ce_loss

        if self.reduction == 'mean':
            return focal_loss.mean()
        elif self.reduction == 'sum':
            return focal_loss.sum()
        return focal_loss


# Practical example: Training on imbalanced data
def train_with_focal_loss():
    # Simulate imbalanced dataset: 1000 negative, 50 positive
    num_samples = 1050
    num_positive = 50

    # Create imbalanced labels
    labels = torch.zeros(num_samples)
    labels[:num_positive] = 1

    # Shuffle
    perm = torch.randperm(num_samples)
    labels = labels[perm]

    # Create features (random for demonstration)
    features = torch.randn(num_samples, 128)

    # Simple classifier
    model = nn.Sequential(
        nn.Linear(128, 64),
        nn.ReLU(),
        nn.Linear(64, 1)
    )

    # Use Focal Loss
    focal_criterion = FocalLoss(alpha=0.75, gamma=2.0)

    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

    # Training loop
    model.train()
    for epoch in range(100):
        optimizer.zero_grad()

        logits = model(features).squeeze()
        loss = focal_criterion(logits, labels)

        loss.backward()
        optimizer.step()

        if (epoch + 1) % 20 == 0:
            with torch.no_grad():
                predictions = (torch.sigmoid(logits) > 0.5).float()
                accuracy = (predictions == labels).float().mean()

                # Calculate precision and recall for positive class
                true_positives = ((predictions == 1) & (labels == 1)).sum()
                predicted_positives = (predictions == 1).sum()
                actual_positives = (labels == 1).sum()

                precision = true_positives / (predicted_positives + 1e-8)
                recall = true_positives / (actual_positives + 1e-8)

                print(f"Epoch {epoch+1}: Loss={loss.item():.4f}, "
                      f"Acc={accuracy:.4f}, Prec={precision:.4f}, Rec={recall:.4f}")


train_with_focal_loss()
```

### Choosing Hyperparameters

**Gamma (Focusing Parameter)**:
- $\gamma = 0$: Equivalent to cross-entropy
- $\gamma = 1$: Moderate focusing
- $\gamma = 2$: Strong focusing (recommended default)
- $\gamma = 5$: Very aggressive focusing (for extreme imbalance)

**Alpha (Class Weight)**:
- Set inversely proportional to class frequency
- For binary classification: use $\alpha$ for rare class, $(1-\alpha)$ for common class
- Typical values: 0.25-0.75 for the rare class

```python
def compute_focal_loss_params(class_counts: list) -> dict:
    """
    Compute recommended focal loss parameters based on class distribution.

    Args:
        class_counts: List of sample counts per class

    Returns:
        Dictionary with recommended alpha and gamma values
    """
    total = sum(class_counts)
    frequencies = [c / total for c in class_counts]

    # Compute alpha as inverse frequency (normalized)
    inv_frequencies = [1.0 / f for f in frequencies]
    alpha_sum = sum(inv_frequencies)
    alpha = torch.tensor([f / alpha_sum for f in inv_frequencies])

    # Recommend gamma based on imbalance ratio
    imbalance_ratio = max(class_counts) / min(class_counts)

    if imbalance_ratio < 10:
        gamma = 1.0
    elif imbalance_ratio < 100:
        gamma = 2.0
    else:
        gamma = 3.0

    return {
        'alpha': alpha,
        'gamma': gamma,
        'imbalance_ratio': imbalance_ratio
    }


# Example usage
class_counts = [10000, 500, 100]  # Highly imbalanced
params = compute_focal_loss_params(class_counts)
print(f"Recommended alpha: {params['alpha']}")
print(f"Recommended gamma: {params['gamma']}")
print(f"Imbalance ratio: {params['imbalance_ratio']:.1f}")
```

### Applications of Focal Loss

- **Object detection**: RetinaNet and other single-stage detectors
- **Medical imaging**: Detecting rare pathologies in scans
- **Fraud detection**: Identifying rare fraudulent transactions
- **Anomaly detection**: Finding unusual patterns in data
- **Any highly imbalanced classification problem**

---

## Knowledge Distillation Loss

### Concept and Motivation

Knowledge Distillation is a model compression technique where a smaller "student" model learns from a larger "teacher" model. Instead of training the student only on hard labels, it also learns from the soft probability distributions produced by the teacher.

**Key Insight**: The teacher's soft labels contain "dark knowledge" - information about relationships between classes that hard labels do not capture. For example, if an image of a car is slightly similar to a truck, the teacher might assign small probability to "truck", teaching the student about this similarity.

### Mathematical Formulation

The Knowledge Distillation loss combines two components:

$$L_{KD} = \alpha \cdot L_{CE}(y, p_s) + (1 - \alpha) \cdot T^2 \cdot L_{KL}(p_t^T, p_s^T)$$

Where:
- $L_{CE}$ is the cross-entropy loss with hard labels
- $L_{KL}$ is the KL divergence between teacher and student soft labels
- $T$ is the temperature for softening distributions
- $\alpha$ is the weight balancing hard and soft targets
- $p_s^T, p_t^T$ are softened student and teacher probabilities

**Softened Probabilities**:
$$p_i^T = \frac{\exp(z_i / T)}{\sum_j \exp(z_j / T)}$$

Higher temperature produces softer distributions, revealing more structure in the teacher's predictions.

### PyTorch Implementation

```python
class KnowledgeDistillationLoss(nn.Module):
    """
    Knowledge Distillation Loss for model compression.

    Combines cross-entropy with hard labels and KL divergence
    with soft teacher predictions.

    Args:
        temperature: Temperature for softening distributions (default: 4.0)
        alpha: Weight for hard label loss (default: 0.5)
        reduction: 'mean', 'sum', or 'batchmean' (default: 'batchmean')
    """

    def __init__(
        self,
        temperature: float = 4.0,
        alpha: float = 0.5,
        reduction: str = 'batchmean'
    ):
        super().__init__()
        self.temperature = temperature
        self.alpha = alpha
        self.reduction = reduction
        self.kl_div = nn.KLDivLoss(reduction=reduction)

    def forward(
        self,
        student_logits: torch.Tensor,
        teacher_logits: torch.Tensor,
        targets: torch.Tensor
    ) -> torch.Tensor:
        """
        Compute Knowledge Distillation loss.

        Args:
            student_logits: Raw logits from student model (batch_size, num_classes)
            teacher_logits: Raw logits from teacher model (batch_size, num_classes)
            targets: Ground truth class labels (batch_size,)

        Returns:
            Combined distillation loss
        """
        # Hard label loss (standard cross-entropy)
        hard_loss = F.cross_entropy(student_logits, targets)

        # Soft label loss (KL divergence with temperature)
        soft_student = F.log_softmax(student_logits / self.temperature, dim=1)
        soft_teacher = F.softmax(teacher_logits / self.temperature, dim=1)

        # KL divergence (multiply by T^2 as per Hinton et al.)
        soft_loss = self.kl_div(soft_student, soft_teacher) * (self.temperature ** 2)

        # Combined loss
        loss = self.alpha * hard_loss + (1 - self.alpha) * soft_loss

        return loss


class FeatureDistillationLoss(nn.Module):
    """
    Feature-based Knowledge Distillation Loss.

    Aligns intermediate feature representations between
    teacher and student networks.

    Args:
        student_channels: Number of channels in student features
        teacher_channels: Number of channels in teacher features
    """

    def __init__(
        self,
        student_channels: int,
        teacher_channels: int
    ):
        super().__init__()
        # Projection layer to match dimensions if different
        if student_channels != teacher_channels:
            self.projector = nn.Conv2d(
                student_channels, teacher_channels,
                kernel_size=1, bias=False
            )
        else:
            self.projector = nn.Identity()

    def forward(
        self,
        student_features: torch.Tensor,
        teacher_features: torch.Tensor
    ) -> torch.Tensor:
        """
        Compute feature distillation loss.

        Args:
            student_features: Feature maps from student (batch, C, H, W)
            teacher_features: Feature maps from teacher (batch, C', H, W)

        Returns:
            MSE loss between normalized features
        """
        # Project student features to teacher dimension
        student_proj = self.projector(student_features)

        # Normalize features
        student_norm = F.normalize(student_proj.view(student_proj.size(0), -1), dim=1)
        teacher_norm = F.normalize(teacher_features.view(teacher_features.size(0), -1), dim=1)

        # MSE loss
        loss = F.mse_loss(student_norm, teacher_norm)

        return loss


class AttentionDistillationLoss(nn.Module):
    """
    Attention Transfer for Knowledge Distillation.

    Transfers attention maps (spatial importance) from teacher to student.
    Based on "Paying More Attention to Attention" (Zagoruyko & Komodakis).
    """

    def __init__(self, p: int = 2):
        super().__init__()
        self.p = p  # Power for attention map computation

    def compute_attention_map(self, features: torch.Tensor) -> torch.Tensor:
        """
        Compute spatial attention map from feature maps.

        Args:
            features: Feature maps of shape (batch, channels, H, W)

        Returns:
            Attention maps of shape (batch, H*W)
        """
        # Sum of absolute values raised to power p across channels
        attention = torch.pow(torch.abs(features), self.p)
        attention = torch.sum(attention, dim=1)  # (batch, H, W)

        # Flatten and normalize
        attention = attention.view(attention.size(0), -1)  # (batch, H*W)
        attention = F.normalize(attention, p=2, dim=1)

        return attention

    def forward(
        self,
        student_features: torch.Tensor,
        teacher_features: torch.Tensor
    ) -> torch.Tensor:
        """
        Compute attention transfer loss.

        Args:
            student_features: Feature maps from student
            teacher_features: Feature maps from teacher

        Returns:
            MSE loss between attention maps
        """
        student_attention = self.compute_attention_map(student_features)
        teacher_attention = self.compute_attention_map(teacher_features)

        loss = F.mse_loss(student_attention, teacher_attention)

        return loss


# Example: Distilling a larger model to a smaller one
def distillation_example():
    """Demonstrate knowledge distillation setup."""

    # Simple teacher and student for demonstration
    teacher = nn.Sequential(
        nn.Linear(784, 1024),
        nn.ReLU(),
        nn.Linear(1024, 512),
        nn.ReLU(),
        nn.Linear(512, 10)
    )

    student = nn.Sequential(
        nn.Linear(784, 256),
        nn.ReLU(),
        nn.Linear(256, 10)
    )

    # Count parameters
    teacher_params = sum(p.numel() for p in teacher.parameters())
    student_params = sum(p.numel() for p in student.parameters())

    print(f"Teacher parameters: {teacher_params:,}")
    print(f"Student parameters: {student_params:,}")
    print(f"Compression ratio: {teacher_params / student_params:.2f}x")

    # Setup distillation
    kd_loss = KnowledgeDistillationLoss(temperature=4.0, alpha=0.3)

    # Simulated batch
    inputs = torch.randn(32, 784)
    targets = torch.randint(0, 10, (32,))

    # Training step
    with torch.no_grad():
        teacher_logits = teacher(inputs)

    student_logits = student(inputs)

    loss = kd_loss(student_logits, teacher_logits, targets)
    print(f"Distillation loss: {loss.item():.4f}")


distillation_example()
```

### Advanced Distillation Techniques

```python
class SelfDistillationLoss(nn.Module):
    """
    Self-Distillation: Using deeper layers to teach shallower ones.

    The network distills knowledge from its own deeper layers
    to auxiliary classifiers attached to earlier layers.
    """

    def __init__(
        self,
        num_classifiers: int = 4,
        temperature: float = 3.0
    ):
        super().__init__()
        self.temperature = temperature
        self.num_classifiers = num_classifiers

    def forward(
        self,
        classifier_logits: list,
        targets: torch.Tensor
    ) -> torch.Tensor:
        """
        Compute self-distillation loss.

        Args:
            classifier_logits: List of logits from each classifier
                               (deepest to shallowest)
            targets: Ground truth labels

        Returns:
            Combined self-distillation loss
        """
        num_classifiers = len(classifier_logits)

        # Deepest classifier uses only hard labels
        total_loss = F.cross_entropy(classifier_logits[0], targets)

        # Other classifiers learn from deeper ones
        for i in range(1, num_classifiers):
            # Hard label loss
            hard_loss = F.cross_entropy(classifier_logits[i], targets)

            # Soft label loss from deeper classifier
            with torch.no_grad():
                teacher_soft = F.softmax(
                    classifier_logits[i-1] / self.temperature, dim=1
                )

            student_log_soft = F.log_softmax(
                classifier_logits[i] / self.temperature, dim=1
            )

            soft_loss = F.kl_div(
                student_log_soft, teacher_soft,
                reduction='batchmean'
            ) * (self.temperature ** 2)

            # Combine with increasing weight for deeper classifiers
            weight = (num_classifiers - i) / num_classifiers
            total_loss += weight * (0.5 * hard_loss + 0.5 * soft_loss)

        return total_loss / num_classifiers
```

### Applications of Knowledge Distillation

- **Model compression**: Deploying efficient models on edge devices
- **Ensemble distillation**: Combining multiple models into one
- **Cross-modal transfer**: Distilling from one modality to another
- **Data-free distillation**: Transferring knowledge without original training data
- **Continual learning**: Preventing catastrophic forgetting

---

## Triplet Loss

### Concept and Motivation

Triplet Loss is designed for learning embeddings where the distance between similar samples is smaller than the distance between dissimilar samples. Unlike Contrastive Loss which works with pairs, Triplet Loss uses triplets: an anchor, a positive (same class), and a negative (different class).

**Key Idea**: For each anchor, ensure its embedding is closer to all positives than to any negative by a margin.

### Mathematical Formulation

$$L = \max(0, d(a, p) - d(a, n) + m)$$

Where:
- $a$ is the anchor embedding
- $p$ is the positive embedding (same class as anchor)
- $n$ is the negative embedding (different class from anchor)
- $d(\cdot, \cdot)$ is the distance function (usually Euclidean or cosine)
- $m$ is the margin

**Interpretation**: The loss is zero when $d(a, n) > d(a, p) + m$, meaning the negative is sufficiently farther than the positive.

### PyTorch Implementation

```python
class TripletLoss(nn.Module):
    """
    Triplet Loss for metric learning.

    Learns embeddings where anchor-positive distance is smaller
    than anchor-negative distance by at least a margin.

    Args:
        margin: Minimum gap between positive and negative distances (default: 1.0)
        distance: 'euclidean' or 'cosine' (default: 'euclidean')
        reduction: 'mean', 'sum', or 'none' (default: 'mean')
    """

    def __init__(
        self,
        margin: float = 1.0,
        distance: str = 'euclidean',
        reduction: str = 'mean'
    ):
        super().__init__()
        self.margin = margin
        self.distance = distance
        self.reduction = reduction

    def compute_distance(
        self,
        x1: torch.Tensor,
        x2: torch.Tensor
    ) -> torch.Tensor:
        """Compute distance between embeddings."""
        if self.distance == 'euclidean':
            return F.pairwise_distance(x1, x2, p=2)
        elif self.distance == 'cosine':
            # Cosine distance = 1 - cosine similarity
            cos_sim = F.cosine_similarity(x1, x2)
            return 1 - cos_sim
        else:
            raise ValueError(f"Unknown distance: {self.distance}")

    def forward(
        self,
        anchor: torch.Tensor,
        positive: torch.Tensor,
        negative: torch.Tensor
    ) -> torch.Tensor:
        """
        Compute Triplet Loss.

        Args:
            anchor: Anchor embeddings (batch_size, embedding_dim)
            positive: Positive embeddings (batch_size, embedding_dim)
            negative: Negative embeddings (batch_size, embedding_dim)

        Returns:
            Triplet loss value
        """
        # Compute distances
        pos_dist = self.compute_distance(anchor, positive)
        neg_dist = self.compute_distance(anchor, negative)

        # Compute triplet loss
        loss = torch.clamp(pos_dist - neg_dist + self.margin, min=0.0)

        if self.reduction == 'mean':
            return loss.mean()
        elif self.reduction == 'sum':
            return loss.sum()
        return loss


class OnlineTripletLoss(nn.Module):
    """
    Online Triplet Mining with Triplet Loss.

    Mines hard triplets within a batch instead of using
    pre-computed triplets. This is more efficient and
    provides harder training examples.

    Args:
        margin: Triplet margin (default: 1.0)
        mining_type: 'hard', 'semi-hard', or 'all' (default: 'semi-hard')
    """

    def __init__(
        self,
        margin: float = 1.0,
        mining_type: str = 'semi-hard'
    ):
        super().__init__()
        self.margin = margin
        self.mining_type = mining_type

    def compute_pairwise_distances(
        self,
        embeddings: torch.Tensor
    ) -> torch.Tensor:
        """
        Compute all pairwise distances in a batch.

        Args:
            embeddings: Embeddings of shape (batch_size, embedding_dim)

        Returns:
            Distance matrix of shape (batch_size, batch_size)
        """
        dot_product = torch.mm(embeddings, embeddings.t())
        square_norm = torch.diag(dot_product)

        distances = square_norm.unsqueeze(0) - 2.0 * dot_product + square_norm.unsqueeze(1)
        distances = torch.clamp(distances, min=0.0)

        # Add epsilon before sqrt for numerical stability
        distances = torch.sqrt(distances + 1e-16)

        return distances

    def get_valid_triplets_mask(
        self,
        labels: torch.Tensor
    ) -> tuple:
        """
        Get masks for valid positive and negative pairs.

        Args:
            labels: Class labels of shape (batch_size,)

        Returns:
            positive_mask: (batch_size, batch_size) - True for same class
            negative_mask: (batch_size, batch_size) - True for different class
        """
        labels = labels.unsqueeze(0)

        # Same label = positive pair
        positive_mask = (labels == labels.t()) & ~torch.eye(
            labels.size(1), dtype=torch.bool, device=labels.device
        )

        # Different label = negative pair
        negative_mask = labels != labels.t()

        return positive_mask, negative_mask

    def mine_hard_triplets(
        self,
        embeddings: torch.Tensor,
        labels: torch.Tensor
    ) -> tuple:
        """
        Mine hard triplets from a batch.

        Returns triplet loss and number of valid triplets.
        """
        batch_size = embeddings.size(0)
        distances = self.compute_pairwise_distances(embeddings)
        positive_mask, negative_mask = self.get_valid_triplets_mask(labels)

        # Hardest negative = closest negative to anchor
        neg_distances = distances.clone()
        neg_distances[~negative_mask] = float('inf')
        hardest_negative_dist, _ = neg_distances.min(dim=1)

        # Hardest positive = farthest positive from anchor
        pos_distances = distances.clone()
        pos_distances[~positive_mask] = 0.0
        hardest_positive_dist, _ = pos_distances.max(dim=1)

        # Compute triplet loss for hard triplets
        triplet_loss = torch.clamp(
            hardest_positive_dist - hardest_negative_dist + self.margin,
            min=0.0
        )

        # Only count valid triplets
        valid_mask = (hardest_positive_dist > 0) & (hardest_negative_dist < float('inf'))

        if valid_mask.sum() > 0:
            loss = triplet_loss[valid_mask].mean()
        else:
            loss = torch.tensor(0.0, device=embeddings.device, requires_grad=True)

        return loss, valid_mask.sum().item()

    def forward(
        self,
        embeddings: torch.Tensor,
        labels: torch.Tensor
    ) -> torch.Tensor:
        """
        Compute online triplet loss.

        Args:
            embeddings: Batch embeddings (batch_size, embedding_dim)
            labels: Class labels (batch_size,)

        Returns:
            Triplet loss
        """
        if self.mining_type == 'hard':
            loss, num_triplets = self.mine_hard_triplets(embeddings, labels)
        else:
            loss, num_triplets = self.mine_hard_triplets(embeddings, labels)

        return loss


# Triplet network example
class TripletNetwork(nn.Module):
    """
    Network for learning embeddings with triplet loss.

    Uses weight sharing (Siamese-style) across all three branches.
    """

    def __init__(
        self,
        input_dim: int = 784,
        embedding_dim: int = 128
    ):
        super().__init__()

        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 512),
            nn.ReLU(inplace=True),
            nn.BatchNorm1d(512),
            nn.Dropout(0.2),
            nn.Linear(512, 256),
            nn.ReLU(inplace=True),
            nn.BatchNorm1d(256),
            nn.Linear(256, embedding_dim)
        )

    def forward_one(self, x: torch.Tensor) -> torch.Tensor:
        """Encode a single input to embedding space."""
        embedding = self.encoder(x)
        # L2 normalize embeddings
        return F.normalize(embedding, p=2, dim=1)

    def forward(
        self,
        anchor: torch.Tensor,
        positive: torch.Tensor = None,
        negative: torch.Tensor = None
    ) -> tuple:
        """
        Forward pass for triplets.

        If only anchor is provided, returns single embedding.
        """
        anchor_emb = self.forward_one(anchor)

        if positive is None and negative is None:
            return anchor_emb

        positive_emb = self.forward_one(positive)
        negative_emb = self.forward_one(negative)

        return anchor_emb, positive_emb, negative_emb


# Complete training example
def train_with_triplet_loss():
    """Training example with triplet loss and online mining."""

    # Initialize model
    model = TripletNetwork(input_dim=128, embedding_dim=64)

    # Use online triplet loss with semi-hard mining
    criterion = OnlineTripletLoss(margin=0.5, mining_type='semi-hard')

    optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

    # Simulate batch with multiple classes
    batch_size = 64
    num_classes = 8
    samples_per_class = batch_size // num_classes

    # Create batch with balanced classes
    features = torch.randn(batch_size, 128)
    labels = torch.repeat_interleave(
        torch.arange(num_classes),
        samples_per_class
    )

    # Training step
    model.train()
    optimizer.zero_grad()

    # Get embeddings for all samples
    embeddings = model.forward_one(features)

    # Compute online triplet loss
    loss = criterion(embeddings, labels)

    loss.backward()
    optimizer.step()

    print(f"Triplet Loss: {loss.item():.4f}")


train_with_triplet_loss()
```

### Triplet Mining Strategies

The choice of triplets significantly impacts training:

| Mining Strategy | Description | Use Case |
|-----------------|-------------|----------|
| Random | Random triplets from batch | Initial exploration |
| Hard | Hardest positive and negative | Fast convergence, risk of collapse |
| Semi-hard | Negatives within margin | Stable training, good results |
| All | All valid triplets | Comprehensive but slow |

### Applications of Triplet Loss

- **Face recognition**: FaceNet and modern face verification systems
- **Person re-identification**: Matching people across camera views
- **Image retrieval**: Finding similar images in a database
- **Fine-grained recognition**: Distinguishing similar categories
- **Recommendation systems**: Learning user/item embeddings

---

## Combining Loss Functions

### Multi-Task Learning Losses

In practice, models often optimize multiple objectives simultaneously:

```python
class MultiTaskLoss(nn.Module):
    """
    Combines multiple loss functions with learnable weights.

    Based on "Multi-Task Learning Using Uncertainty to Weigh Losses"
    by Kendall et al.
    """

    def __init__(self, num_tasks: int, learnable_weights: bool = True):
        super().__init__()
        self.num_tasks = num_tasks
        self.learnable_weights = learnable_weights

        if learnable_weights:
            # Log variance for numerical stability
            self.log_vars = nn.Parameter(torch.zeros(num_tasks))

    def forward(self, losses: list) -> torch.Tensor:
        """
        Combine losses with uncertainty weighting.

        Args:
            losses: List of individual task losses

        Returns:
            Combined weighted loss
        """
        if not self.learnable_weights:
            return sum(losses) / len(losses)

        total_loss = 0
        for i, loss in enumerate(losses):
            # Weight = exp(-log_var) = 1/var
            precision = torch.exp(-self.log_vars[i])
            total_loss += precision * loss + self.log_vars[i]

        return total_loss


class HybridEmbeddingLoss(nn.Module):
    """
    Combines classification and metric learning losses.

    Useful for tasks requiring both classification and retrieval.
    """

    def __init__(
        self,
        num_classes: int,
        embedding_dim: int,
        margin: float = 0.5,
        classification_weight: float = 1.0,
        triplet_weight: float = 1.0
    ):
        super().__init__()

        self.classifier = nn.Linear(embedding_dim, num_classes)
        self.ce_loss = nn.CrossEntropyLoss()
        self.triplet_loss = OnlineTripletLoss(margin=margin)

        self.classification_weight = classification_weight
        self.triplet_weight = triplet_weight

    def forward(
        self,
        embeddings: torch.Tensor,
        labels: torch.Tensor
    ) -> dict:
        """
        Compute hybrid loss.

        Returns:
            Dictionary with individual and total losses
        """
        # Classification loss
        logits = self.classifier(embeddings)
        ce_loss = self.ce_loss(logits, labels)

        # Triplet loss
        triplet_loss = self.triplet_loss(embeddings, labels)

        # Combined loss
        total_loss = (
            self.classification_weight * ce_loss +
            self.triplet_weight * triplet_loss
        )

        return {
            'total': total_loss,
            'classification': ce_loss,
            'triplet': triplet_loss
        }
```

---

## Best Practices and Guidelines

### Loss Function Selection Guide

| Task | Recommended Loss | Key Considerations |
|------|------------------|-------------------|
| Similarity learning | Contrastive/Triplet | Choose margin carefully |
| Imbalanced classification | Focal Loss | Tune gamma and alpha |
| Model compression | Knowledge Distillation | Temperature affects softness |
| Retrieval/Verification | Triplet + Classification | Combine for best results |
| Self-supervised learning | InfoNCE | Temperature is critical |

### Hyperparameter Guidelines

```python
def get_loss_recommendations(task_type: str) -> dict:
    """
    Get recommended hyperparameters for different tasks.
    """
    recommendations = {
        'similarity': {
            'loss': 'ContrastiveLoss or TripletLoss',
            'margin': '0.5 - 2.0 (start with 1.0)',
            'embedding_dim': '64 - 512',
            'normalize_embeddings': True,
            'mining': 'Semi-hard for stability, hard for performance'
        },
        'imbalanced': {
            'loss': 'FocalLoss',
            'gamma': '2.0 (increase for more imbalance)',
            'alpha': 'Inverse class frequency (normalized)',
        },
        'distillation': {
            'loss': 'KnowledgeDistillationLoss',
            'temperature': '4.0 - 20.0 (higher = softer)',
            'alpha': '0.1 - 0.5 (weight for hard labels)',
        },
        'retrieval': {
            'loss': 'HybridEmbeddingLoss',
            'classification_weight': '1.0',
            'triplet_weight': '0.5 - 1.0',
            'margin': '0.3 - 0.5 for normalized embeddings'
        }
    }

    return recommendations.get(task_type, {})
```

### Common Pitfalls and Solutions

| Issue | Solution |
|-------|----------|
| Embedding collapse in triplet loss | Use semi-hard mining, lower margin |
| Focal loss not converging | Reduce gamma, check alpha values |
| Distillation not working | Increase temperature, train teacher longer |
| Contrastive loss plateauing | Increase margin, use harder negatives |

---

## Summary

### Key Takeaways

1. **Contrastive Loss**: Learns embeddings by pulling similar pairs together and pushing dissimilar pairs apart. Essential for Siamese networks and self-supervised learning.

2. **Focal Loss**: Addresses class imbalance by down-weighting easy examples and focusing on hard ones. Critical for object detection and medical imaging.

3. **Knowledge Distillation Loss**: Transfers knowledge from large teacher models to smaller student models. Key for model compression and deployment.

4. **Triplet Loss**: Learns metric spaces where same-class samples are closer than different-class samples. Foundation for face recognition and retrieval.

### When to Use Each Loss

- Use **Contrastive Loss** when you have pairs of similar/dissimilar samples
- Use **Focal Loss** when dealing with severe class imbalance
- Use **Knowledge Distillation** when compressing models or ensemble distillation
- Use **Triplet Loss** when you need fine-grained similarity rankings

### Implementation Checklist

When implementing these losses:

1. Normalize embeddings (especially for metric learning)
2. Choose appropriate margins based on embedding space
3. Use proper mining strategies for triplet/contrastive learning
4. Monitor for embedding collapse
5. Combine losses when appropriate for your task
6. Use curriculum learning for complex multi-objective training

---

## Further Reading

- **Contrastive Learning**: "A Simple Framework for Contrastive Learning of Visual Representations" (SimCLR)
- **Focal Loss**: "Focal Loss for Dense Object Detection" (RetinaNet)
- **Knowledge Distillation**: "Distilling the Knowledge in a Neural Network" (Hinton et al.)
- **Triplet Loss**: "FaceNet: A Unified Embedding for Face Recognition and Clustering"
- **Modern Contrastive Learning**: "Momentum Contrast for Unsupervised Visual Representation Learning" (MoCo)
