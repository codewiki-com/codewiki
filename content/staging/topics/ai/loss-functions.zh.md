---
title: 深度学习进阶：损失函数详解
description: 掌握各类损失函数：对比学习损失、Focal Loss和知识蒸馏损失
track: ai
section: deep-learning
difficulty: intermediate
tags:
  - 损失函数
  - 对比学习
  - Focal Loss
  - 知识蒸馏
status: imported
origin: old/src/content/docs/datascience/loss-functions.zh.md
divergence: 0.239
issues: []
legacy:
  category: DataScience
  subcategory: DeepLearning
  order: 20
  lastUpdated: 2026-01-07
---

损失函数是深度学习的核心组件，它定义了模型优化的目标。选择合适的损失函数对模型性能至关重要。本文将深入介绍各类进阶损失函数，从经典的交叉熵到对比学习损失、知识蒸馏损失等前沿技术。

---

## 交叉熵损失

交叉熵损失（Cross-Entropy Loss）是分类任务中最常用的损失函数，源自信息论中的交叉熵概念。

### 信息论基础

**信息熵**衡量随机变量的不确定性：

$$H(p) = -\sum_{i} p_i \log(p_i)$$

**交叉熵**衡量两个概率分布之间的差异：

$$H(p, q) = -\sum_{i} p_i \log(q_i)$$

其中 $p$ 是真实分布，$q$ 是预测分布。

### 二分类交叉熵（BCE）

**数学公式：**

$$\mathcal{L}_{BCE} = -\frac{1}{N}\sum_{i=1}^{N}[y_i \log(\hat{y}_i) + (1-y_i)\log(1-\hat{y}_i)]$$

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

# 方法1：使用BCELoss（需要先经过Sigmoid）
bce_loss = nn.BCELoss()
predictions = torch.sigmoid(torch.randn(32, 1))
targets = torch.randint(0, 2, (32, 1)).float()
loss = bce_loss(predictions, targets)

# 方法2：使用BCEWithLogitsLoss（更稳定，内部包含Sigmoid）
bce_with_logits = nn.BCEWithLogitsLoss()
logits = torch.randn(32, 1)
loss = bce_with_logits(logits, targets)

# 手动实现BCE
def binary_cross_entropy(predictions, targets, epsilon=1e-7):
    """
    手动实现二分类交叉熵
    epsilon用于数值稳定性，防止log(0)
    """
    predictions = torch.clamp(predictions, epsilon, 1 - epsilon)
    loss = -targets * torch.log(predictions) - (1 - targets) * torch.log(1 - predictions)
    return loss.mean()
```

### 多分类交叉熵

**数学公式：**

$$\mathcal{L}_{CE} = -\frac{1}{N}\sum_{i=1}^{N}\sum_{c=1}^{C} y_{i,c} \log(\hat{y}_{i,c})$$

对于one-hot编码的标签，简化为：

$$\mathcal{L}_{CE} = -\frac{1}{N}\sum_{i=1}^{N} \log(\hat{y}_{i,c_i})$$

其中 $c_i$ 是样本 $i$ 的真实类别。

```python
# PyTorch中的多分类交叉熵
ce_loss = nn.CrossEntropyLoss()
logits = torch.randn(32, 10)  # batch_size=32, num_classes=10
targets = torch.randint(0, 10, (32,))
loss = ce_loss(logits, targets)

# 分解为LogSoftmax + NLLLoss
log_softmax = nn.LogSoftmax(dim=1)
nll_loss = nn.NLLLoss()
log_probs = log_softmax(logits)
loss = nll_loss(log_probs, targets)

# 手动实现多分类交叉熵
def cross_entropy_loss(logits, targets):
    """
    手动实现交叉熵损失
    logits: [batch_size, num_classes]
    targets: [batch_size] 类别索引
    """
    # 数值稳定的softmax
    max_logits = logits.max(dim=1, keepdim=True).values
    shifted_logits = logits - max_logits
    log_sum_exp = torch.log(torch.exp(shifted_logits).sum(dim=1))

    # 获取目标类别的logit
    target_logits = logits.gather(1, targets.unsqueeze(1)).squeeze(1)

    # 交叉熵 = -log(softmax) = -target_logit + log_sum_exp + max_logit
    loss = -target_logits + log_sum_exp + max_logits.squeeze(1)
    return loss.mean()
```

### 带权重的交叉熵

处理类别不平衡的基本方法：

```python
# 假设有3个类别，样本数分别为1000, 100, 50
class_counts = torch.tensor([1000, 100, 50], dtype=torch.float)
# 权重与样本数成反比
class_weights = 1.0 / class_counts
# 归一化
class_weights = class_weights / class_weights.sum() * len(class_counts)
print(f"类别权重: {class_weights}")

# 使用权重
weighted_ce = nn.CrossEntropyLoss(weight=class_weights)
loss = weighted_ce(logits, targets)
```

### Label Smoothing

标签平滑通过软化one-hot标签来提升泛化能力：

$$y_{smooth} = (1 - \alpha) \cdot y_{one-hot} + \frac{\alpha}{C}$$

```python
class LabelSmoothingCrossEntropy(nn.Module):
    """
    标签平滑交叉熵损失

    参数:
        smoothing: 平滑系数，通常设为0.1
        reduction: 'mean' | 'sum' | 'none'
    """
    def __init__(self, smoothing=0.1, reduction='mean'):
        super().__init__()
        self.smoothing = smoothing
        self.reduction = reduction

    def forward(self, logits, targets):
        num_classes = logits.size(-1)

        # 创建平滑后的标签分布
        with torch.no_grad():
            smooth_targets = torch.zeros_like(logits)
            smooth_targets.fill_(self.smoothing / (num_classes - 1))
            smooth_targets.scatter_(1, targets.unsqueeze(1), 1.0 - self.smoothing)

        # 计算交叉熵
        log_probs = F.log_softmax(logits, dim=-1)
        loss = -smooth_targets * log_probs
        loss = loss.sum(dim=-1)

        if self.reduction == 'mean':
            return loss.mean()
        elif self.reduction == 'sum':
            return loss.sum()
        return loss

# 使用示例
criterion = LabelSmoothingCrossEntropy(smoothing=0.1)
loss = criterion(logits, targets)
```

---

## Focal Loss：解决类别不平衡

Focal Loss由林宗谊等人在RetinaNet论文中提出，专门用于解决目标检测中的类别极度不平衡问题。

### 问题背景

在目标检测中，背景样本（负样本）远多于前景样本（正样本），比例可达1000:1。标准交叉熵损失会被大量简单负样本主导，难以学习困难样本。

### Focal Loss原理

**核心思想：** 降低易分类样本的权重，让模型专注于困难样本。

**数学公式：**

$$FL(p_t) = -\alpha_t (1 - p_t)^\gamma \log(p_t)$$

其中：
- $p_t$ 是模型对正确类别的预测概率
- $\gamma$ 是聚焦参数（focusing parameter），通常取2
- $\alpha_t$ 是类别权重因子

**直观理解：**
- 当 $p_t \to 1$（易分类样本）：$(1-p_t)^\gamma \to 0$，损失趋近于0
- 当 $p_t \to 0$（困难样本）：$(1-p_t)^\gamma \to 1$，保持原始损失

```python
class FocalLoss(nn.Module):
    """
    Focal Loss用于解决类别不平衡问题

    参数:
        alpha: 类别权重因子，可以是标量或tensor
        gamma: 聚焦参数，控制易分类样本的权重下降速度
        reduction: 'mean' | 'sum' | 'none'
    """
    def __init__(self, alpha=1.0, gamma=2.0, reduction='mean'):
        super().__init__()
        self.alpha = alpha
        self.gamma = gamma
        self.reduction = reduction

    def forward(self, logits, targets):
        # 计算交叉熵（不做reduction）
        ce_loss = F.cross_entropy(logits, targets, reduction='none')

        # 获取预测概率
        probs = torch.exp(-ce_loss)  # p_t

        # 计算focal权重
        focal_weight = (1 - probs) ** self.gamma

        # 处理alpha权重
        if isinstance(self.alpha, (float, int)):
            alpha_weight = self.alpha
        else:
            alpha_weight = self.alpha.gather(0, targets)

        # 计算focal loss
        focal_loss = alpha_weight * focal_weight * ce_loss

        if self.reduction == 'mean':
            return focal_loss.mean()
        elif self.reduction == 'sum':
            return focal_loss.sum()
        return focal_loss


class FocalLossBinary(nn.Module):
    """
    二分类Focal Loss
    """
    def __init__(self, alpha=0.25, gamma=2.0, reduction='mean'):
        super().__init__()
        self.alpha = alpha
        self.gamma = gamma
        self.reduction = reduction

    def forward(self, logits, targets):
        # 计算概率
        probs = torch.sigmoid(logits)

        # 二分类交叉熵
        bce_loss = F.binary_cross_entropy_with_logits(
            logits, targets, reduction='none'
        )

        # p_t
        p_t = probs * targets + (1 - probs) * (1 - targets)

        # alpha_t
        alpha_t = self.alpha * targets + (1 - self.alpha) * (1 - targets)

        # focal weight
        focal_weight = (1 - p_t) ** self.gamma

        # focal loss
        focal_loss = alpha_t * focal_weight * bce_loss

        if self.reduction == 'mean':
            return focal_loss.mean()
        elif self.reduction == 'sum':
            return focal_loss.sum()
        return focal_loss


# 使用示例
focal_loss = FocalLoss(alpha=1.0, gamma=2.0)
logits = torch.randn(32, 10)
targets = torch.randint(0, 10, (32,))
loss = focal_loss(logits, targets)

# 针对类别不平衡，使用不同的alpha
# 假设类别0有1000个样本，类别1有100个样本
alpha = torch.tensor([0.1, 0.9])  # 少数类给更大权重
focal_loss_weighted = FocalLoss(alpha=alpha, gamma=2.0)
```

### 参数选择

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| gamma | 2.0 | 经验值，增大会更关注困难样本 |
| alpha | 0.25 (正样本) | 根据类别比例调整 |

```python
# 实验不同gamma值的影响
import matplotlib.pyplot as plt
import numpy as np

def visualize_focal_loss():
    p = np.linspace(0.01, 0.99, 100)

    plt.figure(figsize=(10, 6))

    # 标准交叉熵 (gamma=0)
    ce = -np.log(p)
    plt.plot(p, ce, label='CE (gamma=0)', linewidth=2)

    # Focal Loss with different gamma
    for gamma in [0.5, 1, 2, 5]:
        fl = -((1 - p) ** gamma) * np.log(p)
        plt.plot(p, fl, label=f'FL (gamma={gamma})', linewidth=2)

    plt.xlabel('Probability of Ground Truth Class')
    plt.ylabel('Loss')
    plt.title('Focal Loss vs Cross Entropy')
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.savefig('focal_loss_comparison.png', dpi=150)
    plt.show()
```

---

## 对比学习损失

对比学习（Contrastive Learning）是自监督学习的核心技术，通过拉近相似样本、推开不相似样本来学习表示。

### InfoNCE Loss

InfoNCE（Noise Contrastive Estimation）是对比学习中最常用的损失函数。

**数学公式：**

$$\mathcal{L}_{InfoNCE} = -\log \frac{\exp(sim(z_i, z_j) / \tau)}{\sum_{k=1}^{2N} \mathbb{1}_{[k \neq i]} \exp(sim(z_i, z_k) / \tau)}$$

其中：
- $z_i, z_j$ 是正样本对的表示
- $\tau$ 是温度参数
- $sim(\cdot, \cdot)$ 是相似度函数（通常是余弦相似度）

```python
class InfoNCELoss(nn.Module):
    """
    InfoNCE Loss用于对比学习

    参数:
        temperature: 温度参数，控制分布的尖锐程度
    """
    def __init__(self, temperature=0.07):
        super().__init__()
        self.temperature = temperature

    def forward(self, features):
        """
        features: [2*batch_size, feature_dim]
        假设前batch_size个和后batch_size个是正样本对
        即 features[i] 和 features[i + batch_size] 是正样本对
        """
        batch_size = features.shape[0] // 2

        # L2归一化
        features = F.normalize(features, dim=1)

        # 计算相似度矩阵
        similarity_matrix = torch.matmul(features, features.T) / self.temperature

        # 创建标签：正样本对的位置
        labels = torch.cat([
            torch.arange(batch_size, 2 * batch_size),
            torch.arange(batch_size)
        ]).to(features.device)

        # 创建mask，去除对角线（自身相似度）
        mask = torch.eye(2 * batch_size, dtype=torch.bool).to(features.device)
        similarity_matrix = similarity_matrix.masked_fill(mask, -float('inf'))

        # 计算InfoNCE损失
        loss = F.cross_entropy(similarity_matrix, labels)

        return loss


# SimCLR风格的实现
class SimCLRLoss(nn.Module):
    """
    SimCLR对比学习损失（NT-Xent Loss）
    """
    def __init__(self, temperature=0.5, batch_size=256):
        super().__init__()
        self.temperature = temperature
        self.batch_size = batch_size

    def forward(self, z_i, z_j):
        """
        z_i, z_j: [batch_size, feature_dim] 两个augmentation的表示
        """
        batch_size = z_i.shape[0]

        # L2归一化
        z_i = F.normalize(z_i, dim=1)
        z_j = F.normalize(z_j, dim=1)

        # 拼接表示
        representations = torch.cat([z_i, z_j], dim=0)  # [2*batch_size, dim]

        # 计算相似度矩阵
        similarity_matrix = F.cosine_similarity(
            representations.unsqueeze(1),
            representations.unsqueeze(0),
            dim=2
        )  # [2*batch_size, 2*batch_size]

        # 正样本对的mask
        # z_i[k]的正样本是z_j[k]，反之亦然
        labels = torch.cat([
            torch.arange(batch_size, 2 * batch_size),
            torch.arange(batch_size)
        ]).to(z_i.device)

        # 去除自身相似度
        mask = torch.eye(2 * batch_size, dtype=torch.bool).to(z_i.device)
        similarity_matrix = similarity_matrix.masked_fill(mask, -float('inf'))

        # 除以温度
        similarity_matrix = similarity_matrix / self.temperature

        # NT-Xent Loss
        loss = F.cross_entropy(similarity_matrix, labels)

        return loss


# 使用示例
simclr_loss = SimCLRLoss(temperature=0.5)
z_i = torch.randn(256, 128)  # augmentation 1
z_j = torch.randn(256, 128)  # augmentation 2
loss = simclr_loss(z_i, z_j)
```

### SupCon Loss（监督对比损失）

在有标签的情况下，利用标签信息构建正负样本对：

```python
class SupConLoss(nn.Module):
    """
    Supervised Contrastive Loss
    来自论文: "Supervised Contrastive Learning"

    参数:
        temperature: 温度参数
        contrast_mode: 'all' 使用所有样本作为锚点
                      'one' 只使用第一个augmentation作为锚点
    """
    def __init__(self, temperature=0.07, contrast_mode='all'):
        super().__init__()
        self.temperature = temperature
        self.contrast_mode = contrast_mode

    def forward(self, features, labels):
        """
        features: [batch_size, n_views, feature_dim]
        labels: [batch_size]
        """
        device = features.device
        batch_size = features.shape[0]
        n_views = features.shape[1]

        # 标签处理
        labels = labels.contiguous().view(-1, 1)
        mask = torch.eq(labels, labels.T).float().to(device)  # [batch_size, batch_size]

        # 展开features: [batch_size * n_views, feature_dim]
        contrast_features = features.view(batch_size * n_views, -1)

        # L2归一化
        contrast_features = F.normalize(contrast_features, dim=1)

        if self.contrast_mode == 'one':
            anchor_features = features[:, 0]  # 只用第一个view作为锚点
            anchor_count = 1
        else:
            anchor_features = contrast_features
            anchor_count = n_views

        # 计算相似度
        anchor_features = F.normalize(anchor_features, dim=1)
        anchor_dot_contrast = torch.matmul(anchor_features, contrast_features.T) / self.temperature

        # 数值稳定性
        logits_max, _ = torch.max(anchor_dot_contrast, dim=1, keepdim=True)
        logits = anchor_dot_contrast - logits_max.detach()

        # 扩展mask以匹配多个views
        mask = mask.repeat(anchor_count, n_views)

        # 去除自身
        logits_mask = torch.scatter(
            torch.ones_like(mask),
            1,
            torch.arange(batch_size * anchor_count).view(-1, 1).to(device),
            0
        )
        mask = mask * logits_mask

        # 计算log_prob
        exp_logits = torch.exp(logits) * logits_mask
        log_prob = logits - torch.log(exp_logits.sum(1, keepdim=True) + 1e-8)

        # 计算正样本对的平均log概率
        mean_log_prob_pos = (mask * log_prob).sum(1) / (mask.sum(1) + 1e-8)

        # 损失
        loss = -mean_log_prob_pos
        loss = loss.view(anchor_count, batch_size).mean()

        return loss
```

### 温度参数的影响

温度参数 $\tau$ 控制分布的尖锐程度：

- **低温度（如0.07）**：分布更尖锐，更关注困难负样本
- **高温度（如1.0）**：分布更平滑，对所有负样本权重更均匀

```python
def analyze_temperature_effect():
    """分析温度参数对相似度分布的影响"""
    similarities = torch.randn(100)  # 模拟相似度分数

    temperatures = [0.07, 0.1, 0.5, 1.0]

    for temp in temperatures:
        probs = F.softmax(similarities / temp, dim=0)
        entropy = -(probs * torch.log(probs + 1e-8)).sum()
        print(f"Temperature {temp}: Entropy = {entropy:.4f}")
```

---

## Triplet Loss

Triplet Loss通过三元组（锚点、正样本、负样本）学习度量空间。

### 基本原理

**目标：** 使锚点与正样本的距离小于与负样本的距离。

**数学公式：**

$$\mathcal{L}_{triplet} = \max(0, d(a, p) - d(a, n) + margin)$$

其中：
- $a$ 是锚点（anchor）
- $p$ 是正样本（positive）
- $n$ 是负样本（negative）
- $margin$ 是边界值

```python
class TripletLoss(nn.Module):
    """
    Triplet Loss用于度量学习

    参数:
        margin: 边界值
        p: 距离度量的p范数（2表示欧氏距离）
    """
    def __init__(self, margin=1.0, p=2):
        super().__init__()
        self.margin = margin
        self.p = p

    def forward(self, anchor, positive, negative):
        """
        anchor, positive, negative: [batch_size, feature_dim]
        """
        # 计算距离
        pos_dist = F.pairwise_distance(anchor, positive, p=self.p)
        neg_dist = F.pairwise_distance(anchor, negative, p=self.p)

        # Triplet loss
        loss = F.relu(pos_dist - neg_dist + self.margin)

        return loss.mean()


class TripletMarginLoss(nn.Module):
    """
    使用余弦相似度的Triplet Loss
    """
    def __init__(self, margin=0.3):
        super().__init__()
        self.margin = margin

    def forward(self, anchor, positive, negative):
        # L2归一化
        anchor = F.normalize(anchor, dim=1)
        positive = F.normalize(positive, dim=1)
        negative = F.normalize(negative, dim=1)

        # 余弦相似度
        pos_sim = (anchor * positive).sum(dim=1)
        neg_sim = (anchor * negative).sum(dim=1)

        # 损失：希望pos_sim > neg_sim + margin
        loss = F.relu(neg_sim - pos_sim + self.margin)

        return loss.mean()


# PyTorch内置的TripletMarginLoss
triplet_loss = nn.TripletMarginLoss(margin=1.0, p=2)
anchor = torch.randn(32, 128)
positive = torch.randn(32, 128)
negative = torch.randn(32, 128)
loss = triplet_loss(anchor, positive, negative)
```

### 三元组挖掘策略

选择合适的三元组对训练效果至关重要：

```python
class TripletMiner:
    """
    三元组挖掘器
    """
    def __init__(self, margin=0.2):
        self.margin = margin

    def get_triplets_hard(self, embeddings, labels):
        """
        Hard Negative Mining: 选择最困难的负样本
        """
        device = embeddings.device
        batch_size = embeddings.shape[0]

        # 计算距离矩阵
        embeddings = F.normalize(embeddings, dim=1)
        dist_matrix = 1 - torch.mm(embeddings, embeddings.t())  # 余弦距离

        # 创建标签mask
        labels = labels.view(-1, 1)
        pos_mask = (labels == labels.t()).float()
        neg_mask = (labels != labels.t()).float()

        triplets = []

        for i in range(batch_size):
            # 找到所有正样本
            pos_indices = torch.where(pos_mask[i] == 1)[0]
            pos_indices = pos_indices[pos_indices != i]  # 排除自身

            if len(pos_indices) == 0:
                continue

            # 找到最困难的正样本（距离最远的正样本）
            pos_dists = dist_matrix[i, pos_indices]
            hardest_pos_idx = pos_indices[pos_dists.argmax()]

            # 找到所有负样本
            neg_indices = torch.where(neg_mask[i] == 1)[0]

            if len(neg_indices) == 0:
                continue

            # 找到最困难的负样本（距离最近的负样本）
            neg_dists = dist_matrix[i, neg_indices]
            hardest_neg_idx = neg_indices[neg_dists.argmin()]

            triplets.append((i, hardest_pos_idx.item(), hardest_neg_idx.item()))

        return triplets

    def get_triplets_semi_hard(self, embeddings, labels):
        """
        Semi-Hard Negative Mining:
        选择满足 d(a,p) < d(a,n) < d(a,p) + margin 的负样本
        """
        device = embeddings.device
        batch_size = embeddings.shape[0]

        embeddings = F.normalize(embeddings, dim=1)
        dist_matrix = 1 - torch.mm(embeddings, embeddings.t())

        labels = labels.view(-1, 1)
        pos_mask = (labels == labels.t()).float()
        neg_mask = (labels != labels.t()).float()

        triplets = []

        for i in range(batch_size):
            pos_indices = torch.where(pos_mask[i] == 1)[0]
            pos_indices = pos_indices[pos_indices != i]

            if len(pos_indices) == 0:
                continue

            for pos_idx in pos_indices:
                pos_dist = dist_matrix[i, pos_idx]

                # 找semi-hard负样本
                neg_indices = torch.where(neg_mask[i] == 1)[0]
                neg_dists = dist_matrix[i, neg_indices]

                # 满足条件: pos_dist < neg_dist < pos_dist + margin
                semi_hard_mask = (neg_dists > pos_dist) & (neg_dists < pos_dist + self.margin)
                semi_hard_indices = neg_indices[semi_hard_mask]

                if len(semi_hard_indices) > 0:
                    # 随机选择一个
                    neg_idx = semi_hard_indices[torch.randint(len(semi_hard_indices), (1,))]
                    triplets.append((i, pos_idx.item(), neg_idx.item()))

        return triplets


# 使用示例
miner = TripletMiner(margin=0.2)
embeddings = torch.randn(64, 128)
labels = torch.randint(0, 10, (64,))

hard_triplets = miner.get_triplets_hard(embeddings, labels)
print(f"挖掘到 {len(hard_triplets)} 个困难三元组")
```

---

## 知识蒸馏损失

知识蒸馏（Knowledge Distillation）将大模型（教师）的知识转移到小模型（学生）。

### 基本原理

**核心思想：** 学生模型不仅学习硬标签，还学习教师模型的软标签（soft targets）。

**总损失：**

$$\mathcal{L}_{KD} = \alpha \mathcal{L}_{CE}(y, \sigma(z_s)) + (1-\alpha) T^2 \mathcal{L}_{KL}(\sigma(z_t/T), \sigma(z_s/T))$$

其中：
- $z_s, z_t$ 分别是学生和教师的logits
- $T$ 是温度参数（软化分布）
- $\alpha$ 是硬标签损失的权重

```python
class DistillationLoss(nn.Module):
    """
    知识蒸馏损失

    参数:
        temperature: 温度参数，用于软化概率分布
        alpha: 硬标签损失的权重
    """
    def __init__(self, temperature=4.0, alpha=0.5):
        super().__init__()
        self.temperature = temperature
        self.alpha = alpha
        self.ce_loss = nn.CrossEntropyLoss()
        self.kl_loss = nn.KLDivLoss(reduction='batchmean')

    def forward(self, student_logits, teacher_logits, targets):
        """
        student_logits: 学生模型的输出 [batch_size, num_classes]
        teacher_logits: 教师模型的输出 [batch_size, num_classes]
        targets: 真实标签 [batch_size]
        """
        # 硬标签损失（与真实标签）
        hard_loss = self.ce_loss(student_logits, targets)

        # 软标签损失（与教师模型）
        # 使用温度软化分布
        student_soft = F.log_softmax(student_logits / self.temperature, dim=1)
        teacher_soft = F.softmax(teacher_logits / self.temperature, dim=1)

        soft_loss = self.kl_loss(student_soft, teacher_soft) * (self.temperature ** 2)

        # 总损失
        total_loss = self.alpha * hard_loss + (1 - self.alpha) * soft_loss

        return total_loss, hard_loss, soft_loss


class FeatureDistillationLoss(nn.Module):
    """
    特征蒸馏损失
    让学生的中间特征与教师的中间特征对齐
    """
    def __init__(self):
        super().__init__()
        self.mse_loss = nn.MSELoss()

    def forward(self, student_features, teacher_features, projector=None):
        """
        student_features: 学生的中间特征
        teacher_features: 教师的中间特征
        projector: 可选的投影层（当维度不匹配时）
        """
        if projector is not None:
            student_features = projector(student_features)

        # L2归一化后计算MSE
        student_features = F.normalize(student_features, dim=1)
        teacher_features = F.normalize(teacher_features, dim=1)

        return self.mse_loss(student_features, teacher_features)


class AttentionDistillationLoss(nn.Module):
    """
    注意力蒸馏损失
    让学生学习教师的注意力图
    """
    def __init__(self):
        super().__init__()

    def forward(self, student_attention, teacher_attention):
        """
        attention: [batch_size, num_heads, seq_len, seq_len]
        """
        # 对head维度取平均
        student_att = student_attention.mean(dim=1)  # [batch, seq, seq]
        teacher_att = teacher_attention.mean(dim=1)

        # KL散度
        student_log = torch.log(student_att + 1e-8)
        loss = F.kl_div(student_log, teacher_att, reduction='batchmean')

        return loss


# 完整的蒸馏训练示例
class DistillationTrainer:
    """知识蒸馏训练器"""

    def __init__(self, teacher_model, student_model, temperature=4.0, alpha=0.5):
        self.teacher = teacher_model
        self.student = student_model
        self.criterion = DistillationLoss(temperature, alpha)

        # 冻结教师模型
        for param in self.teacher.parameters():
            param.requires_grad = False

    def train_step(self, inputs, targets, optimizer):
        self.student.train()

        # 教师前向传播（不计算梯度）
        with torch.no_grad():
            teacher_logits = self.teacher(inputs)

        # 学生前向传播
        student_logits = self.student(inputs)

        # 计算蒸馏损失
        total_loss, hard_loss, soft_loss = self.criterion(
            student_logits, teacher_logits, targets
        )

        # 反向传播
        optimizer.zero_grad()
        total_loss.backward()
        optimizer.step()

        return {
            'total_loss': total_loss.item(),
            'hard_loss': hard_loss.item(),
            'soft_loss': soft_loss.item()
        }


# 使用示例
teacher = nn.Linear(784, 10)
student = nn.Linear(784, 10)

trainer = DistillationTrainer(teacher, student, temperature=4.0, alpha=0.5)
optimizer = torch.optim.Adam(student.parameters(), lr=0.001)

# 模拟训练
inputs = torch.randn(32, 784)
targets = torch.randint(0, 10, (32,))
loss_dict = trainer.train_step(inputs, targets, optimizer)
print(f"Total: {loss_dict['total_loss']:.4f}, Hard: {loss_dict['hard_loss']:.4f}, Soft: {loss_dict['soft_loss']:.4f}")
```

### 温度参数的作用

温度 $T$ 软化教师的输出分布：

```python
def visualize_temperature_effect():
    """可视化温度对分布的影响"""
    logits = torch.tensor([2.0, 1.0, 0.5, 0.2, 0.1])

    print("不同温度下的概率分布:")
    for T in [1, 2, 4, 8]:
        probs = F.softmax(logits / T, dim=0)
        print(f"T={T}: {probs.numpy().round(3)}")

# 输出示例:
# T=1: [0.506 0.186 0.113 0.084 0.076] (较尖锐)
# T=4: [0.291 0.228 0.196 0.176 0.170] (更平滑)
```

**温度的作用：**
- 高温度使分布更平滑，暴露更多类别间的关系
- 较低的非目标类别概率包含了教师学到的"暗知识"

---

## 多任务学习损失

多任务学习同时优化多个目标，需要平衡各任务的损失。

### 简单加权方法

```python
class MultiTaskLoss(nn.Module):
    """
    多任务损失：简单加权求和
    """
    def __init__(self, task_weights=None):
        super().__init__()
        self.task_weights = task_weights

    def forward(self, losses_dict):
        """
        losses_dict: {'task1': loss1, 'task2': loss2, ...}
        """
        total_loss = 0
        for task_name, loss in losses_dict.items():
            weight = self.task_weights.get(task_name, 1.0) if self.task_weights else 1.0
            total_loss += weight * loss
        return total_loss
```

### 不确定性加权（Uncertainty Weighting）

自动学习任务权重，基于任务不确定性：

```python
class UncertaintyWeightedLoss(nn.Module):
    """
    基于不确定性的多任务损失加权
    来自论文: "Multi-Task Learning Using Uncertainty to Weigh Losses"

    自动学习每个任务的权重，基于同方差不确定性
    """
    def __init__(self, num_tasks):
        super().__init__()
        # 可学习的log方差参数
        self.log_vars = nn.Parameter(torch.zeros(num_tasks))

    def forward(self, losses):
        """
        losses: list of task losses [loss1, loss2, ...]
        """
        total_loss = 0
        weighted_losses = []

        for i, loss in enumerate(losses):
            # 精度 = 1 / sigma^2
            precision = torch.exp(-self.log_vars[i])
            # 加权损失 + 正则项
            weighted_loss = precision * loss + self.log_vars[i]
            total_loss += weighted_loss
            weighted_losses.append(weighted_loss)

        return total_loss, weighted_losses, torch.exp(self.log_vars)


# 使用示例
class MultiTaskModel(nn.Module):
    def __init__(self, input_dim, num_classes_task1, num_classes_task2):
        super().__init__()
        self.shared = nn.Sequential(
            nn.Linear(input_dim, 256),
            nn.ReLU(),
            nn.Linear(256, 128),
            nn.ReLU()
        )
        self.task1_head = nn.Linear(128, num_classes_task1)
        self.task2_head = nn.Linear(128, num_classes_task2)

    def forward(self, x):
        shared_features = self.shared(x)
        return self.task1_head(shared_features), self.task2_head(shared_features)


# 训练示例
model = MultiTaskModel(784, 10, 5)
uncertainty_loss = UncertaintyWeightedLoss(num_tasks=2)
optimizer = torch.optim.Adam(
    list(model.parameters()) + list(uncertainty_loss.parameters()),
    lr=0.001
)

x = torch.randn(32, 784)
y1 = torch.randint(0, 10, (32,))
y2 = torch.randint(0, 5, (32,))

out1, out2 = model(x)
loss1 = F.cross_entropy(out1, y1)
loss2 = F.cross_entropy(out2, y2)

total_loss, weighted_losses, learned_weights = uncertainty_loss([loss1, loss2])
print(f"学习到的权重: {learned_weights.detach().numpy()}")
```

### GradNorm：梯度归一化

根据梯度大小动态调整权重：

```python
class GradNormLoss(nn.Module):
    """
    GradNorm: Gradient Normalization for Adaptive Loss Balancing

    根据梯度大小自动平衡多任务损失
    """
    def __init__(self, num_tasks, alpha=1.5):
        super().__init__()
        self.num_tasks = num_tasks
        self.alpha = alpha  # 恢复力度参数
        self.weights = nn.Parameter(torch.ones(num_tasks))
        self.initial_losses = None

    def forward(self, losses, shared_params):
        """
        losses: list of task losses
        shared_params: 共享层的参数（用于计算梯度）
        """
        # 记录初始损失（用于计算相对训练速度）
        if self.initial_losses is None:
            self.initial_losses = [l.detach() for l in losses]

        # 加权损失
        weighted_loss = sum(self.weights[i] * losses[i] for i in range(self.num_tasks))

        return weighted_loss

    def update_weights(self, losses, shared_params, optimizer_weights):
        """
        更新任务权重
        """
        # 计算每个任务的梯度范数
        grad_norms = []
        for i, loss in enumerate(losses):
            # 计算对共享参数的梯度
            grads = torch.autograd.grad(
                self.weights[i] * loss,
                shared_params,
                retain_graph=True,
                create_graph=True
            )
            grad_norm = torch.norm(torch.stack([g.norm() for g in grads]))
            grad_norms.append(grad_norm)

        grad_norms = torch.stack(grad_norms)
        mean_grad_norm = grad_norms.mean()

        # 计算相对训练速度
        loss_ratios = torch.stack([
            losses[i].detach() / self.initial_losses[i]
            for i in range(self.num_tasks)
        ])
        inverse_train_rates = loss_ratios / loss_ratios.mean()

        # 目标梯度范数
        target_grad_norms = mean_grad_norm * (inverse_train_rates ** self.alpha)

        # GradNorm损失
        gradnorm_loss = (grad_norms - target_grad_norms.detach()).abs().sum()

        # 更新权重
        optimizer_weights.zero_grad()
        gradnorm_loss.backward()
        optimizer_weights.step()

        # 重新归一化权重
        with torch.no_grad():
            self.weights.data = self.weights.data / self.weights.data.sum() * self.num_tasks
```

---

## 自定义损失函数

### 设计原则

设计自定义损失函数时需要考虑：

1. **可微性**：确保损失函数可以计算梯度
2. **数值稳定性**：避免log(0)、除以0等情况
3. **尺度一致性**：不同部分的损失应在相近的尺度
4. **物理意义**：损失值应该反映真实的优化目标

```python
class CustomLoss(nn.Module):
    """
    自定义损失函数模板
    """
    def __init__(self, config):
        super().__init__()
        self.config = config
        # 初始化子损失函数
        self.ce_loss = nn.CrossEntropyLoss()
        self.mse_loss = nn.MSELoss()

    def forward(self, predictions, targets, **kwargs):
        """
        自定义损失计算
        """
        # 示例：组合多个损失
        loss1 = self.ce_loss(predictions['logits'], targets['labels'])
        loss2 = self.mse_loss(predictions['features'], targets['features'])

        # 可以添加正则项
        regularization = self._compute_regularization(kwargs.get('model'))

        total_loss = loss1 + self.config['lambda'] * loss2 + regularization

        return total_loss, {'ce': loss1, 'mse': loss2, 'reg': regularization}

    def _compute_regularization(self, model):
        if model is None:
            return 0

        l2_reg = sum(p.pow(2).sum() for p in model.parameters())
        return self.config.get('weight_decay', 0) * l2_reg
```

### 常见自定义损失

#### Dice Loss（医学图像分割）

```python
class DiceLoss(nn.Module):
    """
    Dice Loss用于分割任务
    Dice = 2|X n Y| / (|X| + |Y|)
    """
    def __init__(self, smooth=1.0):
        super().__init__()
        self.smooth = smooth

    def forward(self, predictions, targets):
        """
        predictions: [batch, classes, H, W] logits
        targets: [batch, H, W] class indices
        """
        num_classes = predictions.shape[1]
        predictions = F.softmax(predictions, dim=1)

        # One-hot编码targets
        targets_one_hot = F.one_hot(targets, num_classes)  # [batch, H, W, classes]
        targets_one_hot = targets_one_hot.permute(0, 3, 1, 2).float()  # [batch, classes, H, W]

        # 展平空间维度
        predictions = predictions.view(predictions.shape[0], num_classes, -1)
        targets_one_hot = targets_one_hot.view(targets_one_hot.shape[0], num_classes, -1)

        # 计算Dice系数
        intersection = (predictions * targets_one_hot).sum(dim=2)
        union = predictions.sum(dim=2) + targets_one_hot.sum(dim=2)

        dice = (2 * intersection + self.smooth) / (union + self.smooth)

        # Dice Loss = 1 - Dice
        return 1 - dice.mean()


class DiceBCELoss(nn.Module):
    """
    组合Dice Loss和BCE Loss
    """
    def __init__(self, dice_weight=0.5):
        super().__init__()
        self.dice_loss = DiceLoss()
        self.bce_loss = nn.BCEWithLogitsLoss()
        self.dice_weight = dice_weight

    def forward(self, predictions, targets):
        dice = self.dice_loss(predictions, targets)
        bce = self.bce_loss(predictions, F.one_hot(targets, predictions.shape[1]).permute(0, 3, 1, 2).float())
        return self.dice_weight * dice + (1 - self.dice_weight) * bce
```

#### IoU Loss（目标检测）

```python
class IoULoss(nn.Module):
    """
    IoU Loss用于边界框回归
    """
    def __init__(self, loss_type='iou'):
        super().__init__()
        self.loss_type = loss_type  # 'iou', 'giou', 'diou', 'ciou'

    def forward(self, pred_boxes, target_boxes):
        """
        boxes: [batch, 4] 格式为 [x1, y1, x2, y2]
        """
        # 计算交集
        inter_x1 = torch.max(pred_boxes[:, 0], target_boxes[:, 0])
        inter_y1 = torch.max(pred_boxes[:, 1], target_boxes[:, 1])
        inter_x2 = torch.min(pred_boxes[:, 2], target_boxes[:, 2])
        inter_y2 = torch.min(pred_boxes[:, 3], target_boxes[:, 3])

        inter_area = torch.clamp(inter_x2 - inter_x1, min=0) * torch.clamp(inter_y2 - inter_y1, min=0)

        # 计算各自面积
        pred_area = (pred_boxes[:, 2] - pred_boxes[:, 0]) * (pred_boxes[:, 3] - pred_boxes[:, 1])
        target_area = (target_boxes[:, 2] - target_boxes[:, 0]) * (target_boxes[:, 3] - target_boxes[:, 1])

        # 计算并集
        union_area = pred_area + target_area - inter_area + 1e-8

        # IoU
        iou = inter_area / union_area

        if self.loss_type == 'iou':
            return 1 - iou.mean()

        elif self.loss_type == 'giou':
            # 计算最小外接矩形
            enclosing_x1 = torch.min(pred_boxes[:, 0], target_boxes[:, 0])
            enclosing_y1 = torch.min(pred_boxes[:, 1], target_boxes[:, 1])
            enclosing_x2 = torch.max(pred_boxes[:, 2], target_boxes[:, 2])
            enclosing_y2 = torch.max(pred_boxes[:, 3], target_boxes[:, 3])

            enclosing_area = (enclosing_x2 - enclosing_x1) * (enclosing_y2 - enclosing_y1) + 1e-8

            giou = iou - (enclosing_area - union_area) / enclosing_area
            return 1 - giou.mean()

        return 1 - iou.mean()
```

#### Perceptual Loss（图像生成）

```python
import torchvision

class PerceptualLoss(nn.Module):
    """
    感知损失：使用预训练VGG的特征计算损失
    """
    def __init__(self, layers=['relu1_2', 'relu2_2', 'relu3_3', 'relu4_3']):
        super().__init__()
        # 加载预训练VGG
        vgg = torchvision.models.vgg19(pretrained=True).features

        # 冻结VGG参数
        for param in vgg.parameters():
            param.requires_grad = False

        self.vgg = vgg
        self.layer_names = layers
        self.layer_indices = {
            'relu1_2': 4,
            'relu2_2': 9,
            'relu3_3': 18,
            'relu4_3': 27,
        }
        self.mse_loss = nn.MSELoss()

    def forward(self, generated, target):
        """
        generated, target: [batch, 3, H, W]
        """
        total_loss = 0

        gen_features = generated
        target_features = target

        for name, module in self.vgg._modules.items():
            gen_features = module(gen_features)
            target_features = module(target_features)

            if int(name) in [self.layer_indices[l] for l in self.layer_names]:
                total_loss += self.mse_loss(gen_features, target_features.detach())

        return total_loss
```

---

## 损失函数选择指南

### 按任务类型选择

| 任务类型 | 推荐损失函数 | 说明 |
|---------|-------------|------|
| 二分类 | BCEWithLogitsLoss | 数值稳定 |
| 多分类 | CrossEntropyLoss | 标准选择 |
| 类别不平衡分类 | Focal Loss | 关注困难样本 |
| 回归 | MSELoss / L1Loss | MSE对异常值敏感 |
| 鲁棒回归 | SmoothL1Loss | Huber损失 |
| 语义分割 | CrossEntropy + Dice | 组合使用 |
| 目标检测 | Focal + IoU | 分类+定位 |
| 度量学习 | Triplet / Contrastive | 学习相似度 |
| 自监督学习 | InfoNCE / NT-Xent | 对比学习 |
| 知识蒸馏 | KL散度 + CE | 软硬标签结合 |
| 图像生成 | Perceptual + Adversarial | 感知质量 |

### 常见问题与解决方案

```python
class LossFunctionGuide:
    """
    损失函数选择指南
    """

    @staticmethod
    def handle_class_imbalance(class_counts, method='weighted'):
        """
        处理类别不平衡
        """
        if method == 'weighted':
            # 反比权重
            weights = 1.0 / torch.tensor(class_counts, dtype=torch.float)
            weights = weights / weights.sum() * len(class_counts)
            return nn.CrossEntropyLoss(weight=weights)

        elif method == 'focal':
            return FocalLoss(gamma=2.0)

        elif method == 'effective_num':
            # 有效样本数加权
            beta = 0.9999
            effective_num = 1 - torch.pow(beta, torch.tensor(class_counts, dtype=torch.float))
            weights = (1 - beta) / effective_num
            weights = weights / weights.sum() * len(class_counts)
            return nn.CrossEntropyLoss(weight=weights)

    @staticmethod
    def handle_noisy_labels(noise_ratio=0.1):
        """
        处理标签噪声
        """
        # 使用标签平滑
        smoothing = min(noise_ratio * 2, 0.3)  # 根据噪声比例调整
        return LabelSmoothingCrossEntropy(smoothing=smoothing)

    @staticmethod
    def handle_outliers():
        """
        处理回归任务中的异常值
        """
        return nn.SmoothL1Loss()  # Huber损失

    @staticmethod
    def combine_losses(losses, weights=None):
        """
        组合多个损失函数
        """
        if weights is None:
            weights = [1.0] * len(losses)

        return sum(w * l for w, l in zip(weights, losses))
```

### 调试技巧

```python
class LossDebugger:
    """
    损失函数调试工具
    """

    @staticmethod
    def check_gradients(loss, model):
        """
        检查梯度是否正常
        """
        loss.backward()

        for name, param in model.named_parameters():
            if param.grad is not None:
                grad_norm = param.grad.norm().item()
                if torch.isnan(param.grad).any():
                    print(f"警告: {name} 梯度包含NaN")
                elif grad_norm > 1000:
                    print(f"警告: {name} 梯度过大: {grad_norm:.2f}")
                elif grad_norm < 1e-8:
                    print(f"警告: {name} 梯度消失: {grad_norm:.2e}")

    @staticmethod
    def monitor_loss_components(loss_dict, step):
        """
        监控各损失组件
        """
        print(f"Step {step}:")
        for name, value in loss_dict.items():
            print(f"  {name}: {value:.4f}")

    @staticmethod
    def check_numerical_stability(predictions, epsilon=1e-7):
        """
        检查数值稳定性
        """
        if torch.isnan(predictions).any():
            print("警告: 预测值包含NaN")
            return False

        if torch.isinf(predictions).any():
            print("警告: 预测值包含Inf")
            return False

        if (predictions.abs() > 1e6).any():
            print("警告: 预测值过大，可能导致数值问题")
            return False

        return True
```

---

## 面试要点

### 基础概念

**Q1: 交叉熵损失和MSE损失的区别？什么时候用哪个？**

- 交叉熵用于分类，MSE用于回归
- 交叉熵对概率分布建模，MSE对连续值建模
- 分类任务用交叉熵收敛更快（梯度更大）
- 交叉熵配合Softmax使用，MSE配合线性输出

**Q2: 为什么分类任务不用MSE损失？**

```python
# MSE损失在分类中的问题
# 假设正确类别的概率很高(0.9)，MSE梯度很小
# 但对于错误预测(0.1)，交叉熵给出更大的梯度

def compare_gradients():
    p = torch.tensor([0.9], requires_grad=True)

    # MSE梯度
    mse_loss = (1 - p) ** 2
    mse_loss.backward()
    print(f"MSE梯度: {p.grad}")  # 较小

    p = torch.tensor([0.9], requires_grad=True)

    # CE梯度
    ce_loss = -torch.log(p)
    ce_loss.backward()
    print(f"CE梯度: {p.grad}")  # 较大，收敛更快
```

**Q3: Focal Loss如何解决类别不平衡？**

- 通过 $(1-p_t)^\gamma$ 权重因子
- 易分类样本（$p_t$高）权重被降低
- 困难样本（$p_t$低）保持原始权重
- 模型聚焦于学习困难样本

### 进阶概念

**Q4: 对比学习损失中温度参数的作用？**

- 控制softmax分布的尖锐程度
- 低温度：更关注最困难的负样本
- 高温度：更均匀地对待所有负样本
- 通常设置为0.07-0.5之间

**Q5: 知识蒸馏中为什么要用高温度？**

- 高温度软化教师的输出分布
- 暴露类别间的相对关系（"暗知识"）
- 学生能学到更多信息，不仅仅是硬标签
- T=4-20是常见范围

**Q6: 多任务学习中如何平衡不同任务的损失？**

- 简单加权：手动设置权重
- 不确定性加权：自动学习基于任务不确定性的权重
- GradNorm：基于梯度大小动态调整
- 任务优先级：根据任务重要性设置

### 实践问题

**Q7: 如何处理损失值为NaN的情况？**

```python
# 常见原因和解决方案
def debug_nan_loss():
    # 1. 检查输入数据是否包含NaN
    # 2. 检查log(0)问题 - 添加小常数epsilon
    # 3. 检查除以0 - 添加epsilon
    # 4. 梯度爆炸 - 使用梯度裁剪
    # 5. 学习率过大 - 降低学习率
    pass
```

**Q8: 如何设计一个好的自定义损失函数？**

1. **可微性**：确保所有操作都可以计算梯度
2. **数值稳定性**：使用log-sum-exp技巧，添加epsilon
3. **合理的尺度**：不同组件在相近的数量级
4. **明确的优化目标**：损失值反映真实的优化目标
5. **测试验证**：在简单数据上验证损失函数行为

---

## 延伸阅读

### 经典论文

1. **Focal Loss**: Lin et al., "Focal Loss for Dense Object Detection", ICCV 2017
2. **SimCLR**: Chen et al., "A Simple Framework for Contrastive Learning", ICML 2020
3. **SupCon**: Khosla et al., "Supervised Contrastive Learning", NeurIPS 2020
4. **Knowledge Distillation**: Hinton et al., "Distilling the Knowledge in a Neural Network", 2015
5. **Multi-Task Uncertainty**: Kendall et al., "Multi-Task Learning Using Uncertainty to Weigh Losses", CVPR 2018

### 推荐资源

1. **PyTorch官方文档** - 损失函数API参考
2. **Papers With Code** - 各任务最新损失函数
3. **知乎/博客** - 损失函数详解系列文章

### 进阶主题

- **对抗训练损失**：GAN系列损失函数
- **能量基损失**：Energy-based models
- **信息论损失**：互信息最大化
- **度量学习损失**：ArcFace, CosFace
- **强化学习损失**：策略梯度、Actor-Critic

---

## 总结

损失函数是深度学习模型优化的核心，本文系统介绍了：

1. **基础损失**：交叉熵、MSE及其变体
2. **类别不平衡**：Focal Loss的原理和实现
3. **对比学习**：InfoNCE、NT-Xent、SupCon Loss
4. **度量学习**：Triplet Loss和三元组挖掘
5. **知识蒸馏**：软标签和特征蒸馏
6. **多任务学习**：不确定性加权和GradNorm
7. **自定义损失**：设计原则和常见实现

选择合适的损失函数需要考虑：
- 任务类型（分类、回归、检测、分割）
- 数据特点（类别平衡、标签噪声、异常值）
- 模型结构（单任务、多任务、蒸馏）
- 优化目标（准确率、召回率、特定指标）

掌握这些损失函数不仅能帮助解决实际问题，也是深度学习面试的重要知识点。建议读者通过实际项目加深理解，在不同场景下尝试各种损失函数的组合。
